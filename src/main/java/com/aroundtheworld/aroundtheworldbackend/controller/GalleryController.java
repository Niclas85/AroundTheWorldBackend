package com.aroundtheworld.aroundtheworldbackend.controller;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.util.*;

@RestController
public class GalleryController {

    @Value("${media.base-path}")
    private String linuxBasePath; // Standardwert für Linux

    @Value("${media.base-path.windows}")
    private String windowsBasePath; // Windows-spezifischer Pfad

    private String mediaBasePath;

    private String mediaPath = "media";

    @PostConstruct
    public void determineMediaBasePath() {
        if (System.getProperty("os.name").toLowerCase().contains("win")) {
            mediaBasePath = windowsBasePath;
        } else {
            mediaBasePath = linuxBasePath;
        }
        System.out.println("Using media base path: " + mediaBasePath);
    }



    @GetMapping("/api/gallery/{stop}")
    public ResponseEntity<List<Map<String, Object>>> getGallery(
            @PathVariable String stop,
            @RequestHeader(value = "Host") String host) { // Host header for constructing the full URL
        File stopFolder = new File(mediaBasePath + "/" + mediaPath , stop);
        System.out.println(stopFolder);
        List<Map<String, Object>> gallery = new ArrayList<>();

        if (!stopFolder.exists() || !stopFolder.isDirectory()) {
            return ResponseEntity.notFound().build();
        }

        // Supported file extensions
        List<String> validExtensions = Arrays.asList(".jpg", ".jpeg", ".png", ".mp4", ".webm");

        // Iterate through main files
        for (File file : Objects.requireNonNull(stopFolder.listFiles())) {
            // Skip thumbnails and invalid files
            if (file.getName().startsWith("thumbnail_") ||
                    validExtensions.stream().noneMatch(file.getName()::endsWith)) {
                continue;
            }

            // Check if the file is a panorama (filename contains "_NNN", "360", or "3D")
            boolean isPanorama = file.getName().matches(".*_\\d{3}\\..*") ||
             //       file.getName().toLowerCase().contains("360") ||
                    file.getName().toLowerCase().contains("3d");



            // Original-Dateiname
            String originalName = file.getName();

// Erzeuge den Thumbnail-Namen im Format "thumbnail_OriginalDateiName.jpg"
            String thumbnailName = "thumbnail_" + originalName.substring(0, originalName.lastIndexOf('.')) + ".jpg";
            File thumbnailFile = new File(stopFolder, thumbnailName);

// Überprüfen, ob das Thumbnail existiert
            if (!thumbnailFile.exists()) {
                // Fallback: Standard-Thumbnail verwenden
                thumbnailName = "default_thumbnail.jpg"; // Standard-Thumbnail-Datei
                thumbnailFile = new File(stopFolder, thumbnailName);
            }


            boolean thumbnailExists = thumbnailFile.exists();


            // Construct full URLs
            String baseUrl = "http://" + host;
            String fileUrl = baseUrl + "/" + mediaPath + "/" + stop + "/" + file.getName();
            String thumbnailUrl = thumbnailExists ? baseUrl + "/" + mediaPath + "/" + stop + "/" + thumbnailName : null;

            // Create entry
            Map<String, Object> entry = new HashMap<>();
            entry.put("thumbnail", thumbnailUrl);
            entry.put("src", fileUrl);
            entry.put("alt", "Bild oder Video");
            entry.put("type", file.getName().toLowerCase().endsWith(".mp4") ? "Video" : "3DPic");
            entry.put("panorama", isPanorama);

            gallery.add(entry);
        }

        return ResponseEntity.ok(gallery);
    }
}
