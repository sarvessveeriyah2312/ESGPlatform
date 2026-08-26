package com.esgeasy.esg.indicators;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Reads uploaded evidence for "Extract with AI" (see IndicatorExtractionService). Text-native
 * formats (PDF via the PDFBox already pulled in transitively by openhtmltopdf-pdfbox for PDF
 * export, plus CSV/plain text) are extracted to plain text; PNG/JPEG evidence is instead passed
 * through as an image attachment for the AI provider's own vision input, since there's no text to
 * extract from a photo of an invoice or certificate. XLSX/DOCX aren't supported yet.
 */
@Component
public class IndicatorDocumentTextExtractor {

    private static final Set<String> TEXT_EXTENSIONS = Set.of("pdf", "csv", "txt");
    private static final Map<String, String> IMAGE_MIME_TYPES = Map.of("png", "image/png", "jpg", "image/jpeg", "jpeg", "image/jpeg");
    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final int MAX_EXTRACTED_CHARS = 20_000;

    public ExtractedEvidence extract(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File exceeds the 10MB limit");
        }
        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null && !file.getOriginalFilename().isBlank() ? file.getOriginalFilename() : "evidence");
        String extension = extensionOf(originalName);

        if (TEXT_EXTENSIONS.contains(extension)) {
            String text = "pdf".equals(extension) ? extractPdf(file) : extractPlainText(file);
            if (!StringUtils.hasText(text)) {
                throw new IllegalArgumentException("Couldn't read any text from this file");
            }
            return ExtractedEvidence.ofText(text.length() > MAX_EXTRACTED_CHARS ? text.substring(0, MAX_EXTRACTED_CHARS) : text);
        }

        String imageMimeType = IMAGE_MIME_TYPES.get(extension);
        if (imageMimeType != null) {
            return ExtractedEvidence.ofImage(imageMimeType, encodeBase64(file));
        }

        throw new IllegalArgumentException(
                "AI extraction currently supports PDF, CSV, plain text, PNG and JPEG files only — got ." + extension);
    }

    private String extractPdf(MultipartFile file) {
        try (InputStream in = file.getInputStream(); PDDocument document = PDDocument.load(in)) {
            return new PDFTextStripper().getText(document);
        } catch (IOException e) {
            throw new IllegalArgumentException("Couldn't read this PDF — it may be corrupted or scanned/image-only", e);
        }
    }

    private String extractPlainText(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalArgumentException("Couldn't read this file", e);
        }
    }

    private String encodeBase64(MultipartFile file) {
        try {
            return Base64.getEncoder().encodeToString(file.getBytes());
        } catch (IOException e) {
            throw new IllegalArgumentException("Couldn't read this file", e);
        }
    }

    private String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
    }

    /** Exactly one of {@code text} or {@code imageBase64Data} is populated. */
    public record ExtractedEvidence(String text, String imageMimeType, String imageBase64Data) {
        static ExtractedEvidence ofText(String text) {
            return new ExtractedEvidence(text, null, null);
        }

        static ExtractedEvidence ofImage(String mimeType, String base64Data) {
            return new ExtractedEvidence(null, mimeType, base64Data);
        }

        public boolean isImage() {
            return imageBase64Data != null;
        }
    }
}
