package com.sflab.model;

public final class Const {
    private Const() {}

    public static final double AREA_M2 = 0.0707;
    public static final double MM_PER_KG = 1.0 / AREA_M2;
    public static final double MASS_GATE_KG = 0.005;
    public static final double MASS_GATE_MM = MASS_GATE_KG * MM_PER_KG;
    public static final double TREF_C = 20.0;
    public static final double[] LAYER_MM = {250, 200, 150};
    public static final String[] LAYER_LABEL = {"15 cm", "35 cm", "55 cm"};
    public static final double SENTINEL = 9000;
}
