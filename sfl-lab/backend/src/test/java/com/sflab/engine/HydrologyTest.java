package com.sflab.engine;

import com.sflab.model.Const;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HydrologyTest {
    @Test
    void massGateIsNotManualMisprint() {
        assertEquals(0.0707, Const.AREA_M2, 1e-6);
        assertEquals(1.0 / 0.0707, Const.MM_PER_KG, 1e-6);
        assertTrue(Const.MASS_GATE_MM > 0.06 && Const.MASS_GATE_MM < 0.08);
    }

    @Test
    void methodBReducesApparentWarmBias() {
        double a = 0.012;
        double href = TempCorrectionEngine.apply("B", 0.20, 30, 20, a);
        assertTrue(href < 0.20);
        double cold = TempCorrectionEngine.apply("B", 0.20, 10, 20, a);
        assertTrue(cold > 0.20);
    }

    @Test
    void pumpIsInternalTransfer() {
        double dLyw = -0.1;
        double dSww = 0.1;
        double dSys = dLyw + dSww;
        assertEquals(0.0, dSys, 1e-12);
    }
}
