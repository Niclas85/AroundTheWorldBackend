package com.aroundtheworld.aroundtheworldbackend.service;

import com.aroundtheworld.aroundtheworldbackend.model.Stop;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.InputStream;
import java.util.List;

@Service
public class StopService {

    private static final String EXTERNAL_FILE_PATH = "/opt/AroundTheWorld/stops.json";
    private static final String INTERNAL_RESOURCE_PATH = "/stops.json";

    public List<Stop> getStops() {
        try {
            ObjectMapper mapper = new ObjectMapper();

            // 1. Prüfen, ob die externe Datei existiert
            File externalFile = new File(EXTERNAL_FILE_PATH);
            if (externalFile.exists()) {
                return mapper.readValue(externalFile, new TypeReference<List<Stop>>() {});
            }

            // 2. Falls nicht, die Datei aus dem JAR laden
            InputStream is = getClass().getResourceAsStream(INTERNAL_RESOURCE_PATH);
            if (is != null) {
                return mapper.readValue(is, new TypeReference<List<Stop>>() {});
            }

            throw new RuntimeException("Weder externe noch interne Stops-Datei gefunden!");

        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Lesen der Stops", e);
        }
    }
}
