package com.aroundtheworld.aroundtheworldbackend.model;

import java.util.List;

public class Stop {
    private String name;
    private List<Double> coords;
    private String description;
    private String folder;
    private String preview;
    private int region;



    private List<String> order;

    // Getter und Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Double> getCoords() { return coords; }
    public void setCoords(List<Double> coords) { this.coords = coords; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public String getPreview() { return preview; }
    public void setPreview(String preview) { this.preview = preview; }

    public int getRegion() { return region; }
    public void setRegion(int region) { this.region = region; }


    public List<String> getOrder() {
        return order;
    }

    public void setOrder(List<String> order) {
        this.order = order;
    }



}
