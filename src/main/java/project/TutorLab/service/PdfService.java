package project.TutorLab.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface PdfService {
    List<String> convertPdfToImages(MultipartFile pdfFile, String sessionId) throws IOException;
}
