package com.esgeasy.esg.indicators;

import com.esgeasy.esg.ai.AiDraftService;
import com.esgeasy.esg.ai.prompt.IndicatorPromptService;
import com.esgeasy.esg.ai.prompt.ResolvedPromptTemplate;
import com.esgeasy.esg.ai.provider.AiProviderException;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.indicators.dto.ExtractionResponse;
import com.esgeasy.esg.reference.IndicatorDefinition;
import com.esgeasy.esg.reference.IndicatorDefinitionRepository;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class IndicatorExtractionServiceTest {

    private static final UUID COMPANY_ID = UUID.randomUUID();
    private static final ResolvedPromptTemplate STUB_TEMPLATE = new ResolvedPromptTemplate("system", "user {{documentText}}");

    private final IndicatorDefinitionRepository definitionRepository = Mockito.mock(IndicatorDefinitionRepository.class);
    private final AiDraftService aiDraftService = Mockito.mock(AiDraftService.class);
    private final IndicatorPromptService indicatorPromptService = Mockito.mock(IndicatorPromptService.class);
    private final CurrentUserProvider currentUserProvider = Mockito.mock(CurrentUserProvider.class);
    private final IndicatorExtractionService service = new IndicatorExtractionService(
            definitionRepository, new IndicatorDocumentTextExtractor(), aiDraftService,
            indicatorPromptService, currentUserProvider, new ObjectMapper());

    private IndicatorDefinition ghgIndicator() {
        IndicatorDefinition def = new IndicatorDefinition();
        def.setId("GHG-SCOPE1");
        def.setName("Scope 1 GHG Emissions");
        def.setUnit("tCO2e");
        return def;
    }

    private void stubCompanyAndTemplate() {
        Mockito.when(currentUserProvider.requireCompanyId()).thenReturn(COMPANY_ID);
        Mockito.when(indicatorPromptService.resolveForIndicator(Mockito.eq("GHG-SCOPE1"), Mockito.eq(COMPANY_ID)))
                .thenReturn(STUB_TEMPLATE);
    }

    @Test
    void extractsValueFromCleanJsonResponse() {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        stubCompanyAndTemplate();
        Mockito.when(aiDraftService.completeWithTemplate(Mockito.eq("extract"), Mockito.eq("indicator-value-extraction"),
                        Mockito.eq(STUB_TEMPLATE), Mockito.anyMap(), Mockito.isNull(), Mockito.isNull()))
                .thenReturn("{\"value\": 1234.5, \"confidence\": \"high\", \"sourceQuote\": \"Total Scope 1 emissions: 1,234.5 tCO2e\"}");

        MockMultipartFile file = new MockMultipartFile("file", "report.csv", "text/csv",
                "Indicator,Value\nScope 1 GHG Emissions,1234.5\n".getBytes());

        ExtractionResponse result = service.extract("GHG-SCOPE1", 2026, file);

        assertThat(result.value()).isEqualByComparingTo(new BigDecimal("1234.5"));
        assertThat(result.confidence()).isEqualTo("high");
        assertThat(result.sourceQuote()).contains("1,234.5");
    }

    @Test
    void extractsValueFromMarkdownFencedResponse() {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        stubCompanyAndTemplate();
        Mockito.when(aiDraftService.completeWithTemplate(Mockito.anyString(), Mockito.anyString(), Mockito.any(),
                        Mockito.anyMap(), Mockito.isNull(), Mockito.isNull()))
                .thenReturn("Here you go:\n```json\n{\"value\": 42, \"confidence\": \"medium\", \"sourceQuote\": \"\"}\n```");

        MockMultipartFile file = new MockMultipartFile("file", "report.csv", "text/csv", "x,y\n1,2\n".getBytes());

        ExtractionResponse result = service.extract("GHG-SCOPE1", 2026, file);

        assertThat(result.value()).isEqualByComparingTo(new BigDecimal("42"));
        assertThat(result.confidence()).isEqualTo("medium");
    }

    @Test
    void nullValueWhenModelCannotFindIt() {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        stubCompanyAndTemplate();
        Mockito.when(aiDraftService.completeWithTemplate(Mockito.anyString(), Mockito.anyString(), Mockito.any(),
                        Mockito.anyMap(), Mockito.isNull(), Mockito.isNull()))
                .thenReturn("{\"value\": null, \"confidence\": \"low\", \"sourceQuote\": \"\"}");

        MockMultipartFile file = new MockMultipartFile("file", "report.csv", "text/csv", "x,y\n1,2\n".getBytes());

        ExtractionResponse result = service.extract("GHG-SCOPE1", 2026, file);

        assertThat(result.value()).isNull();
        assertThat(result.confidence()).isEqualTo("low");
    }

    @Test
    void malformedAiResponseThrowsAiProviderException() {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        stubCompanyAndTemplate();
        Mockito.when(aiDraftService.completeWithTemplate(Mockito.anyString(), Mockito.anyString(), Mockito.any(),
                        Mockito.anyMap(), Mockito.isNull(), Mockito.isNull()))
                .thenReturn("Sorry, I couldn't find that value in the document.");

        MockMultipartFile file = new MockMultipartFile("file", "report.csv", "text/csv", "x,y\n1,2\n".getBytes());

        assertThatThrownBy(() -> service.extract("GHG-SCOPE1", 2026, file))
                .isInstanceOf(AiProviderException.class);
    }

    @Test
    void unknownIndicatorThrowsNotFound() {
        Mockito.when(definitionRepository.findById("NOPE")).thenReturn(Optional.empty());
        MockMultipartFile file = new MockMultipartFile("file", "report.csv", "text/csv", "x,y\n1,2\n".getBytes());

        assertThatThrownBy(() -> service.extract("NOPE", 2026, file))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void unsupportedFileExtensionRejectedBeforeCallingAi() {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        MockMultipartFile file = new MockMultipartFile("file", "report.xlsx", "application/vnd.ms-excel", new byte[]{1, 2, 3});

        assertThatThrownBy(() -> service.extract("GHG-SCOPE1", 2026, file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("PDF, CSV");

        Mockito.verifyNoInteractions(aiDraftService);
    }

    @Test
    void imageEvidenceIsSentAsAnAttachmentNotText() {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        stubCompanyAndTemplate();
        byte[] fakePngBytes = {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3, 4};
        Mockito.when(aiDraftService.completeWithTemplate(Mockito.eq("extract"), Mockito.eq("indicator-value-extraction"),
                        Mockito.eq(STUB_TEMPLATE), Mockito.anyMap(), Mockito.eq("image/png"), Mockito.anyString()))
                .thenReturn("{\"value\": 55.2, \"confidence\": \"medium\", \"sourceQuote\": \"handwritten total on the invoice\"}");

        MockMultipartFile file = new MockMultipartFile("file", "invoice.png", "image/png", fakePngBytes);

        ExtractionResponse result = service.extract("GHG-SCOPE1", 2026, file);

        assertThat(result.value()).isEqualByComparingTo(new BigDecimal("55.2"));
        Mockito.verify(aiDraftService).completeWithTemplate(Mockito.eq("extract"), Mockito.eq("indicator-value-extraction"),
                Mockito.eq(STUB_TEMPLATE), Mockito.anyMap(), Mockito.eq("image/png"), Mockito.anyString());
        Mockito.verify(aiDraftService, Mockito.never())
                .completeWithTemplate(Mockito.anyString(), Mockito.anyString(), Mockito.any(), Mockito.anyMap(), Mockito.isNull(), Mockito.isNull());
    }

    @Test
    void extractsTextFromRealPdf() throws Exception {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        stubCompanyAndTemplate();
        Mockito.when(aiDraftService.completeWithTemplate(Mockito.anyString(), Mockito.anyString(), Mockito.any(),
                        Mockito.<String, String>anyMap(), Mockito.isNull(), Mockito.isNull()))
                .thenAnswer(invocation -> {
                    Map<String, String> context = invocation.getArgument(3);
                    assertThat(context.get("documentText")).contains("Total Scope 1 emissions: 987.6 tCO2e");
                    return "{\"value\": 987.6, \"confidence\": \"high\", \"sourceQuote\": \"Total Scope 1 emissions: 987.6 tCO2e\"}";
                });

        byte[] pdfBytes = buildPdfWithText("Sustainability Report FY2026\nTotal Scope 1 emissions: 987.6 tCO2e\n");
        MockMultipartFile file = new MockMultipartFile("file", "report.pdf", "application/pdf", pdfBytes);

        ExtractionResponse result = service.extract("GHG-SCOPE1", 2026, file);

        assertThat(result.value()).isEqualByComparingTo(new BigDecimal("987.6"));
    }

    @Test
    void usesTheIndicatorSpecificPromptOverrideWhenOneExists() {
        Mockito.when(definitionRepository.findById("GHG-SCOPE1")).thenReturn(Optional.of(ghgIndicator()));
        Mockito.when(currentUserProvider.requireCompanyId()).thenReturn(COMPANY_ID);
        ResolvedPromptTemplate customTemplate = new ResolvedPromptTemplate(
                "custom system prompt", "custom user prompt {{documentText}}");
        Mockito.when(indicatorPromptService.resolveForIndicator("GHG-SCOPE1", COMPANY_ID)).thenReturn(customTemplate);
        Mockito.when(aiDraftService.completeWithTemplate(Mockito.eq("extract"), Mockito.eq("indicator-value-extraction"),
                        Mockito.eq(customTemplate), Mockito.anyMap(), Mockito.isNull(), Mockito.isNull()))
                .thenReturn("{\"value\": 7, \"confidence\": \"high\", \"sourceQuote\": \"\"}");

        MockMultipartFile file = new MockMultipartFile("file", "report.csv", "text/csv", "x,y\n1,2\n".getBytes());

        ExtractionResponse result = service.extract("GHG-SCOPE1", 2026, file);

        assertThat(result.value()).isEqualByComparingTo(new BigDecimal("7"));
        Mockito.verify(aiDraftService).completeWithTemplate(Mockito.eq("extract"), Mockito.eq("indicator-value-extraction"),
                Mockito.eq(customTemplate), Mockito.anyMap(), Mockito.isNull(), Mockito.isNull());
    }

    private byte[] buildPdfWithText(String text) throws Exception {
        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.beginText();
                stream.setFont(PDType1Font.HELVETICA, 12);
                stream.newLineAtOffset(50, 700);
                for (String line : text.split("\n")) {
                    stream.showText(line);
                    stream.newLineAtOffset(0, -16);
                }
                stream.endText();
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            document.save(out);
            return out.toByteArray();
        }
    }
}
