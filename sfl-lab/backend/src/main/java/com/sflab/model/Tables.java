package com.sflab.model;

public final class Tables {
    private Tables() {}

    public static class Weight {
        public long[] t = new long[0];
        public double[] lyw = new double[0];
        public double[] sww = new double[0];
        public double[] pumpIn = new double[0];
        public double[] pumpOut = new double[0];
        public int n() { return t.length; }
    }

    public static class Probe {
        public long[] t = new long[0];
        public double[] vtens = new double[0];
        public double[] refTens = new double[0];
        public double[][] echo = new double[3][0];
        public double[][] mps = new double[3][0];
        public double[][] ec = new double[3][0];
        public double[][] temp = new double[3][0];
        public double[] bottomTemp = new double[0];
        public double[] fieldTemp = new double[0];
        public double[] boxTemp = new double[0];
        public int n() { return t.length; }
    }

    public static class Weather {
        public long[] t = new long[0];
        public double[] precip = new double[0];
        public double[] airT = new double[0];
        public double[] rh = new double[0];
        public double[] rs = new double[0];
        public double[] wind = new double[0];
        public int n() { return t.length; }
    }
}
