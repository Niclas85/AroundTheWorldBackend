package com.aroundtheworld.aroundtheworldbackend.service;


import com.aroundtheworld.aroundtheworldbackend.model.Stop;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;

@Service
public class StopService {
    public List<Stop> getStops() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream is = getClass().getResourceAsStream("/stops.json");
            System.out.println(is);
            return mapper.readValue(is, new TypeReference<List<Stop>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Fehler beim Lesen der Stops", e);
        }
    }
}
