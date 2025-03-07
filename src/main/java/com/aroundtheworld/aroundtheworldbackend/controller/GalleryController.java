package com.aroundtheworld.aroundtheworldbackend.controller;

import com.aroundtheworld.aroundtheworldbackend.model.Stop;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.io.*;
import java.net.URL;
import java.util.*;

@RestController
public class GalleryController {

    @Value("${media.base-path}")
    private String linuxBasePath;

    @Value("${media.base-path.windows}")
    private String windowsBasePath;

    private String mediaBasePath;
    private final String mediaPath = "media";
    private final String EXTERNAL_FILE_PATH = "/opt/AroundTheWorld/stops.json";
    private final String INTERNAL_RESOURCE_PATH = "/stops.json";
    private final ObjectMapper mapper = new ObjectMapper();

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
    public ResponseEntity<List<Map<String, Object>>> getGallery(@PathVariable String stop, @RequestHeader("Host") String host) {
        File stopFolder = new File(mediaBasePath, mediaPath + "/" + stop);
        if (!stopFolder.exists() || !stopFolder.isDirectory()) {
            return ResponseEntity.notFound().build();
        }

        List<Map<String, Object>> gallery = getMediaFiles(stopFolder, stop, host);
        List<Stop> stops = loadStops();

        Optional<Stop> foundStop = stops.stream().filter(folder -> folder.getFolder().equals(stop)).findFirst();
        foundStop.ifPresent(currentStop -> updateStopOrder(currentStop, gallery, stops));


        return ResponseEntity.ok(gallery);
    }

    private List<Map<String, Object>> getMediaFiles(File stopFolder, String stop, String host) {
        List<Map<String, Object>> gallery = new ArrayList<>();
        List<String> validExtensions = Arrays.asList(".jpg", ".jpeg", ".png", ".mp4", ".webm");
        String baseUrl = "http://" + host;

        for (File file : Objects.requireNonNull(stopFolder.listFiles())) {
            if (file.getName().startsWith("thumbnail_") || validExtensions.stream().noneMatch(file.getName()::endsWith)) {
                continue;
            }
            boolean isPanorama = file.getName().matches(".*_\\d{3}\\..*") || file.getName().toLowerCase().contains("3d");
            String originalName = file.getName();
            String thumbnailName = "thumbnail_" + originalName.substring(0, originalName.lastIndexOf('.')) + ".jpg";
            File thumbnailFile = new File(stopFolder, thumbnailName);
            if (!thumbnailFile.exists()) {
                thumbnailName = "default_thumbnail.jpg";
            }
            boolean thumbnailExists = new File(stopFolder, thumbnailName).exists();

            Map<String, Object> entry = new HashMap<>();
            entry.put("thumbnail", thumbnailExists ? baseUrl + "/" + mediaPath + "/" + stop + "/" + thumbnailName : null);
            entry.put("src", baseUrl + "/" + mediaPath + "/" + stop + "/" + file.getName());
            entry.put("alt", "Bild oder Video");
            entry.put("type", file.getName().toLowerCase().endsWith(".mp4") ? "Video" : "3DPic");
            entry.put("panorama", isPanorama);
            entry.put("originalName", originalName);

            gallery.add(entry);
        }
        return gallery;
    }

    private List<Stop> loadStops() {
        List<Stop> stops = new ArrayList<>();
        try {
            File externalFile = new File(EXTERNAL_FILE_PATH);
            if (externalFile.exists()) {
                stops = mapper.readValue(externalFile, new TypeReference<>() {});
            }
            InputStream is = getClass().getResourceAsStream(INTERNAL_RESOURCE_PATH);
            if (is != null) {
                stops = mapper.readValue(is, new TypeReference<>() {});
            }
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Laden der Stops", e);
        }
        return stops;
    }

    private void updateStopOrder(Stop currentStop, List<Map<String, Object>> gallery, List<Stop> stops) {
        boolean updated = false;
        for (Map<String, Object> entry : gallery) {
            String originalName = entry.get("originalName").toString();
            if (!currentStop.getOrder().contains(originalName)) {
                currentStop.getOrder().add(originalName);
                updated = true;
            }
        }
        System.out.println(currentStop.getOrder());
        stops.forEach(stop -> {
            if (stop.getFolder().equals(currentStop.getFolder())) {
                System.out.println("Folder = " +  currentStop.getFolder());
                System.out.println(stop.getOrder());
            }
        });
        System.out.println(updated);
        if (updated) {
            saveStops(stops);
        }
    }

    private void saveStops(List<Stop> stops) {
        try {
            // Externe Datei speichern, falls sie existiert oder erstellt werden kann
            File externalFile = new File(EXTERNAL_FILE_PATH);
            if (externalFile.getParentFile() != null && (externalFile.exists() || externalFile.getParentFile().mkdirs())) {
                mapper.writeValue(externalFile, stops);
                System.out.println("Stops erfolgreich in der externen Datei gespeichert.");
            } else {
                System.out.println("Externe Datei nicht vorhanden oder konnte nicht erstellt werden. Überspringe Speicherung.");
            }

            // Interne Datei speichern
            URL internalResource = getClass().getResource(INTERNAL_RESOURCE_PATH);
            if (internalResource != null) {
                File internalFile = new File(internalResource.toURI());
                mapper.writeValue(internalFile, stops);
                System.out.println("Stops erfolgreich in der internen Datei gespeichert.");
            } else {
                System.out.println("Interne Datei nicht gefunden. Speicherung übersprungen.");
            }

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Speichern der Stops.json", e);
        }
    }

}
