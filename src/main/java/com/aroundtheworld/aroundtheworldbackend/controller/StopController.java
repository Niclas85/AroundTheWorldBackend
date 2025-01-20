package com.aroundtheworld.aroundtheworldbackend.controller;



import com.aroundtheworld.aroundtheworldbackend.model.Stop;
import com.aroundtheworld.aroundtheworldbackend.service.StopService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/stops")
public class StopController {
    private final StopService stopService;

    public StopController(StopService stopService) {
        this.stopService = stopService;
    }

    @GetMapping
    public List<Stop> getStops() {
        return stopService.getStops();
    }
}
