package project.TutorLab.service.impl;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import project.TutorLab.service.PdfService;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class PdfServiceImpl implements PdfService {

    @Value("${app.upload.dir:users-photos}")
    private String uploadDir;

    @Override
    public List<String> convertPdfToImages(MultipartFile pdfFile, String sessionId) throws IOException {
        List<String> imageUrls = new ArrayList<>();

        // Создаём папку для слайдов сессии
        Path sessionPath = Paths.get(uploadDir, "slides", sessionId);
        if (!Files.exists(sessionPath)) {
            Files.createDirectories(sessionPath);
        }

        try (PDDocument document = PDDocument.load(pdfFile.getInputStream())) {
            PDFRenderer renderer = new PDFRenderer(document);

            for (int page = 0; page < document.getNumberOfPages(); page++) {
                BufferedImage image = renderer.renderImageWithDPI(page, 150); // 150 DPI

                String filename = String.format("slide-%03d.png", page);
                Path imagePath = sessionPath.resolve(filename);

                ImageIO.write(image, "PNG", imagePath.toFile());

                String imageUrl = "/api/live/slides/" + sessionId + "/" + filename;
                imageUrls.add(imageUrl);
            }
        }

        return imageUrls;
    }
}
