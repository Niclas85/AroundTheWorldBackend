package com.aroundtheworld.aroundtheworldbackend.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.nio.file.*;

@RestController
@RequestMapping("/upload")
public class FileUploadController {


    private String mediaBasePath;


    @Value("${media.base-path}")
    private String linuxBasePath;

    @Value("${media.base-path.windows}")
    private String windowsBasePath;


    @PostConstruct
    public void determineMediaBasePath() {
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            mediaBasePath = windowsBasePath;
        } else {
            mediaBasePath = linuxBasePath;
        }
        System.out.println("Using media base path: " + mediaBasePath);
    }


    @PostMapping
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file,
                                             @RequestParam("subfolder") String subfolder) {
        try {
            // Erstelle den vollständigen Pfad für das Zielverzeichnis
            Path targetDir = Paths.get(mediaBasePath, subfolder);

            // Wenn das Verzeichnis nicht existiert, erstelle es
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            // Datei speichern
            Path targetPath = targetDir.resolve(file.getOriginalFilename());
            file.transferTo(targetPath);

            return ResponseEntity.ok("Datei erfolgreich hochgeladen: " + targetPath.toString());
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Fehler beim Hochladen der Datei: " + e.getMessage());
        }
    }
}
