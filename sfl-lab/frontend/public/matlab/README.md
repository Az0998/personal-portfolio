# 课堂正向仿真

`generate_sfl_sim.m`（MATLAB）与 `generate_sfl_sim.py`（无 MATLAB 时）写出与 DT80 同表头的 CSV。

物理：面积 0.0707 m²；三层水桶；起始 **2024-06-01**，共 14 天；雨日 **2024-06-05、2024-06-11**；泵不是雨；15 cm θ 含介电日周期。与 `SyntheticDemo.java`、`/sfl-lab` 落地页、`sim_truth.json` 同一套日期。

网站「载入 MATLAB 课堂仿真」是同一套情景的 Java 移植，不需要 MATLAB Runtime。
