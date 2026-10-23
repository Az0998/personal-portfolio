% generate_sfl_sim.m
% 课堂正向物理：三层水桶 + 蒸渗桶质量 + 介电日周期。
% 输出与 DT80 同表头的 CSV，上传到教学站做反演。
% 与网站「载入 MATLAB 课堂仿真」使用同一套情景（Java SyntheticDemo 是本脚本的移植）。
%
% 硬约束：面积 0.0707 m^2；泵不是雨；介电订正只作用于 theta。

function generate_sfl_sim(outDir)
if nargin < 1, outDir = fullfile(fileparts(mfilename('fullpath')), 'out'); end
if ~exist(outDir, 'dir'), mkdir(outDir); end

area = 0.0707;                 % m2
mmPerKg = 1 / area;
t0 = datetime(2024,6,1,0,0,0);
days = 14;
nW = days * 1440;
nP = days * 144;               % 10 min
nZ = days * 96;                % 15 min

lyw = 72.40;
sww = 2.18;
e = [12.4, 21.6, 16.2];        % true theta %
rng(20240601);

tw = strings(nW,1); L = zeros(nW,1); S = zeros(nW,1); Pin = zeros(nW,1); Pout = zeros(nW,1);
for i = 1:nW
    t = t0 + minutes(i-1);
    tw(i) = string(t, 'yyyy/MM/dd HH:mm:ss.SSS');
    hour = hourOf(t); day = dayIndex(t, t0);
    if hour >= 6 && hour < 19, lyw = lyw - 0.000055; else, lyw = lyw - 0.000012; end
    if day == 4 && hour >= 14 && hour < 18, lyw = lyw + 0.0062; end
    if day == 10 && hour >= 9 && hour < 11, lyw = lyw + 0.0031; end
    lyw = lyw + 0.0009 * randn();
    wind = 0;
    if day == 7 && hour >= 2 && hour < 5, wind = 0.018 * sin(i/2); end
    spike = 0;
    if ismember(i, [1851, 7321, 15121]), spike = 0.48; end
    L(i) = lyw + wind + spike;
    Pout(i) = 0; Pin(i) = 0;
    if day == 4 && hour == 19 && minute(t) < 4
        Pout(i) = 8; sww = sww + 0.011;
    end
    if day == 11 && hour == 6 && minute(t) < 3
        Pin(i) = 6; sww = sww - 0.008; lyw = lyw + 0.008;
    end
    sww = sww + 0.0008 * randn();
    S(i) = sww;
end

fid = fopen(fullfile(outDir, 'SFLX1_sim_weight.csv'), 'w');
fprintf(fid, '"Timestamp","TZ","L1-LYW (kg)","L1-SWW (kg)","L1-Pump-in (s)","L1-Pump-out (s)"\n');
for i = 1:nW
    fprintf(fid, '%s,n,%.4f,%.4f,%.1f,%.1f\n', tw(i), L(i), S(i), Pin(i), Pout(i));
end
fclose(fid);

rng(20240602);
tp = strings(nP,1);
echo = zeros(nP,3); mps = zeros(nP,3); ec = zeros(nP,3); T = zeros(nP,3);
vt = zeros(nP,1); rt = zeros(nP,1); Tb = zeros(nP,1); Tf = zeros(nP,1); Tbox = zeros(nP,1);
for i = 1:nP
    t = t0 + minutes(10*(i-1));
    tp(i) = string(t, 'yyyy/MM/dd HH:mm:ss.SSS');
    hour = hourOf(t); day = dayIndex(t, t0);
    sun = max(0, sin((hour-6)/12*pi));
    T(i,1) = 16.5 + 9.5*sun + 0.15*randn();
    T(i,2) = 17.2 + 3.2*sun + 0.08*randn();
    T(i,3) = 16.8 + 1.1*sun + 0.05*randn();
    Tb(i) = T(i,3) + 0.3; Tf(i) = 15 + 11*sun; Tbox(i) = 18 + 4*sun;
    if day == 4 && hour >= 14 && hour < 20, e(1) = e(1) + 0.42;
    elseif hour >= 6 && hour < 19, e(1) = e(1) - 0.012;
    else, e(1) = e(1) - 0.004; end
    e(1) = e(1) + 0.55 * (T(i,1)-20)/20;          % 介电表观（订正对象）
    if day == 4 && hour >= 18, e(2) = e(2) + 0.008; end
    if day >= 5 && day <= 6 && hour >= 2 && hour < 10, e(3) = e(3) + 0.035; end
    echo(i,1) = min(35, max(6, e(1)+0.08*randn()));
    echo(i,2) = min(28, max(18, e(2)+0.04*randn()));
    echo(i,3) = min(24, max(12, e(3)+0.05*randn()));
    ec(i,:) = [0.12+0.01*(echo(i,1)-12)/10, 0.22, 0.18+(day>4)*0.03];
    mps(i,1) = -18 - 0.4*max(0, 16-echo(i,1));
    mps(i,2) = -55;
    mps(i,3) = -90;
    if day == 8 && hour < 6, mps(i,3) = -9990; end
    vt(i) = 32 + 0.4*randn(); rt(i) = 30;
end
fid = fopen(fullfile(outDir, 'SFLX1_sim_probes.csv'), 'w');
fprintf(fid, ['"Timestamp","L1-Echo-T1","L1-Echo-T2","L1-Echo-T3",', ...
    '"L1-MPS-T1","L1-MPS-T2","L1-MPS-T3","L1-EC-T1","L1-EC-T2","L1-EC-T3",', ...
    '"L1-Temp-T1","L1-Temp-T2","L1-Temp-T3","L1-VTENS-T4","L1-RefTens-T4",', ...
    '"L1-BottomTemp","L1-FieldTemp-T4","FieldBox1-Temp"\n']);
for i = 1:nP
    fprintf(fid, '%s,%.3f,%.3f,%.3f,%.1f,%.1f,%.1f,%.4f,%.4f,%.4f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f,%.2f\n', ...
        tp(i), echo(i,:), mps(i,:), ec(i,:), T(i,:), vt(i), rt(i), Tb(i), Tf(i), Tbox(i));
end
fclose(fid);

rng(20240603);
tz = strings(nZ,1); P = zeros(nZ,1); Ta = zeros(nZ,1); RH = zeros(nZ,1); Rs = zeros(nZ,1); U = zeros(nZ,1);
for i = 1:nZ
    t = t0 + minutes(15*(i-1));
    tz(i) = string(t, 'yyyy/MM/dd HH:mm:ss');
    hour = hourOf(t); day = dayIndex(t, t0);
    sun = max(0, sin((hour-6)/12*pi));
    Rs(i) = 920*sun; Ta(i) = 14+12*sun+0.3*randn(); RH(i) = 85-35*sun; U(i) = 1.2+0.8*sun;
    if day == 4 && hour >= 14 && hour < 18, P(i) = 1.35; end
    if day == 10 && hour >= 9 && hour < 11, P(i) = 0.55; end
end
fid = fopen(fullfile(outDir, 'SFLX1_sim_weather.csv'), 'w');
fprintf(fid, '"Timestamp","Precipitation","AirTemperature","RelativeHumidity","SolarRadiation","WindSpeed"\n');
for i = 1:nZ
    fprintf(fid, '%s,%.3f,%.2f,%.1f,%.1f,%.2f\n', tz(i), P(i), Ta(i), RH(i), Rs(i), U(i));
end
fclose(fid);

truth = struct('areaM2', area, 'mmPerKg', mmPerKg, 'start', '2024-06-01', 'days', days, ...
    'rainDays', {{'2024-06-05','2024-06-11'}}, ...
    'note', '泵不是雨；浅层先湿、深层滞后；白天 theta 含介电假抬。');
writelines(jsonencode(truth), fullfile(outDir, 'sim_truth.json'));
fprintf('wrote %s\n', outDir);
end

function h = hourOf(t), h = hour(t); end
function d = dayIndex(t, t0), d = floor(days(t - t0)); end
