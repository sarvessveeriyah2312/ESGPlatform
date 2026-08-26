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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

/**
 * "Extract with AI": reads an uploaded evidence document and suggests a value for the indicator
 * being entered, using the company's own configured AI provider (Settings > AI Assistant) via the
 * same {@link AiDraftService} orchestration as "Draft with AI" — provider dispatch and
 * ai_usage_log reused as-is. The prompt itself is resolved per-indicator via
 * {@link IndicatorPromptService} (a company's override for this specific indicator if one exists,
 * else the shared default) rather than a single fixed draftType, since e.g. a computed ratio
 * indicator needs very different guidance than a raw consumption figure. The suggestion is always
 * a starting point for the user to review in the audit trail form, never applied automatically.
 */
@Service
public class IndicatorExtractionService {

    private static final String DRAFT_TYPE = "indicator-value-extraction";

    private final IndicatorDefinitionRepository indicatorDefinitionRepository;
    private final IndicatorDocumentTextExtractor textExtractor;
    private final AiDraftService aiDraftService;
    private final IndicatorPromptService indicatorPromptService;
    private final CurrentUserProvider currentUserProvider;
    private final ObjectMapper objectMapper;

    public IndicatorExtractionService(IndicatorDefinitionRepository indicatorDefinitionRepository,
                                       IndicatorDocumentTextExtractor textExtractor,
                                       AiDraftService aiDraftService,
                                       IndicatorPromptService indicatorPromptService,
                                       CurrentUserProvider currentUserProvider,
                                       ObjectMapper objectMapper) {
        this.indicatorDefinitionRepository = indicatorDefinitionRepository;
        this.textExtractor = textExtractor;
        this.aiDraftService = aiDraftService;
        this.indicatorPromptService = indicatorPromptService;
        this.currentUserProvider = currentUserProvider;
        this.objectMapper = objectMapper;
    }

    public ExtractionResponse extract(String indicatorId, int fiscalYear, MultipartFile file) {
        IndicatorDefinition indicator = indicatorDefinitionRepository.findById(indicatorId)
                .orElseThrow(() -> new NotFoundException("Indicator not found: " + indicatorId));

        IndicatorDocumentTextExtractor.ExtractedEvidence evidence = textExtractor.extract(file);

        Map<String, String> context = Map.of(
                "indicatorName", indicator.getName(),
                "unit", indicator.getUnit(),
                "fiscalYear", String.valueOf(fiscalYear),
                "documentText", evidence.isImage() ? "(No extracted text — see the attached image evidence.)" : evidence.text()
        );

        UUID companyId = currentUserProvider.requireCompanyId();
        ResolvedPromptTemplate template = indicatorPromptService.resolveForIndicator(indicatorId, companyId);

        String raw = evidence.isImage()
                ? aiDraftService.completeWithTemplate("extract", DRAFT_TYPE, template, context, evidence.imageMimeType(), evidence.imageBase64Data())
                : aiDraftService.completeWithTemplate("extract", DRAFT_TYPE, template, context, null, null);
        return parseResponse(raw);
    }

    private ExtractionResponse parseResponse(String raw) {
        String json = stripToJsonObject(raw);
        try {
            JsonNode node = objectMapper.readTree(json);
            BigDecimal value = node.hasNonNull("value") ? node.get("value").decimalValue() : null;
            String confidence = node.hasNonNull("confidence") ? node.get("confidence").asText() : "low";
            String sourceQuote = node.hasNonNull("sourceQuote") ? node.get("sourceQuote").asText() : "";
            String reason = node.hasNonNull("reason") ? node.get("reason").asText() : "";
            return new ExtractionResponse(value, confidence, sourceQuote, reason);
        } catch (JsonProcessingException | ArithmeticException e) {
            throw new AiProviderException("The AI's response wasn't in the expected format — try again or enter the value manually", e);
        }
    }

    /** Models occasionally wrap JSON in markdown fences or add stray prose despite instructions not to. */
    private String stripToJsonObject(String raw) {
        String cleaned = raw.strip();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```[a-zA-Z]*\\R?", "");
            int lastFence = cleaned.lastIndexOf("```");
            if (lastFence >= 0) {
                cleaned = cleaned.substring(0, lastFence);
            }
            cleaned = cleaned.strip();
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start < 0 || end < start) {
            throw new AiProviderException("The AI's response wasn't in the expected format — try again or enter the value manually");
        }
        return cleaned.substring(start, end + 1);
    }
}
