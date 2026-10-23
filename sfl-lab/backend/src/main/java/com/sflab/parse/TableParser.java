package com.sflab.parse;

import com.sflab.model.Tables;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public class TableParser {
    private static final DateTimeFormatter[] TIMES = {
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss.SSS"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm"),
            DateTimeFormatter.ISO_LOCAL_DATE_TIME
    };
    private static final Pattern NON_ALNUM = Pattern.compile("[^a-z0-9]+");

    public record ParsedTable(List<String> headers, List<String[]> rows) {}

    public ParsedTable read(byte[] bytes, String filename) throws IOException {
        String name = filename == null ? "" : filename.toLowerCase(Locale.ROOT);
        if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
            return readXlsx(bytes);
        }
        return readCsv(bytes);
    }

    public Tables.Weight asWeight(ParsedTable table) {
        Cols cols = new Cols(table.headers);
        int iT = cols.find("timestamp", "datetime", "time", "时间");
        int iLyw = cols.find("l1lyw", "lyw", "l1lywkg");
        int iSww = cols.find("l1sww", "sww", "l1swwkg");
        int iPin = cols.find("l1pumpin", "pumpin", "l1pumpins");
        int iPout = cols.find("l1pumpou", "l1pumpout", "pumpout", "pumpou");
        if (iT < 0 || iLyw < 0) {
            throw new IllegalArgumentException("称重文件需要 Timestamp 与 L1_LYW / L1-LYW 列。");
        }
        Tables.Weight w = new Tables.Weight();
        int n = table.rows.size();
        w.t = new long[n];
        w.lyw = new double[n];
        w.sww = new double[n];
        w.pumpIn = new double[n];
        w.pumpOut = new double[n];
        int k = 0;
        for (String[] row : table.rows) {
            Long t = parseTime(cell(row, iT));
            if (t == null) continue;
            w.t[k] = t;
            w.lyw[k] = parseNum(cell(row, iLyw));
            w.sww[k] = iSww >= 0 ? parseNum(cell(row, iSww)) : Double.NaN;
            w.pumpIn[k] = iPin >= 0 ? parseNum(cell(row, iPin)) : 0;
            w.pumpOut[k] = iPout >= 0 ? parseNum(cell(row, iPout)) : 0;
            k++;
        }
        trim(w, k);
        return w;
    }

    public Tables.Probe asProbe(ParsedTable table) {
        Cols cols = new Cols(table.headers);
        int iT = cols.find("timestamp", "datetime", "time", "时间");
        if (iT < 0) throw new IllegalArgumentException("探头文件需要 Timestamp 列。");
        Tables.Probe p = new Tables.Probe();
        int n = table.rows.size();
        p.t = new long[n];
        p.vtens = new double[n];
        p.refTens = new double[n];
        p.bottomTemp = new double[n];
        p.fieldTemp = new double[n];
        p.boxTemp = new double[n];
        for (int d = 0; d < 3; d++) {
            p.echo[d] = new double[n];
            p.mps[d] = new double[n];
            p.ec[d] = new double[n];
            p.temp[d] = new double[n];
        }
        int iVt = cols.find("l1vtenst4", "vtenst4", "vtens");
        int iRef = cols.find("l1reftenst4", "reftenst4", "reftens");
        int iBot = cols.find("l1bottomtemp", "bottomtemp");
        int iField = cols.find("l1fieldtempt4", "fieldtempt4", "fieldtemp");
        int iBox = cols.find("fieldbox1temp", "fieldboxtemp", "box1temp");
        int[] iEcho = {cols.find("l1echot1"), cols.find("l1echot2"), cols.find("l1echot3")};
        int[] iMps = {cols.find("l1mpst1"), cols.find("l1mpst2"), cols.find("l1mpst3")};
        int[] iEc = {cols.find("l1ect1"), cols.find("l1ect2"), cols.find("l1ect3")};
        int[] iTemp = {cols.find("l1tempt1"), cols.find("l1tempt2"), cols.find("l1tempt3")};
        int k = 0;
        for (String[] row : table.rows) {
            Long t = parseTime(cell(row, iT));
            if (t == null) continue;
            p.t[k] = t;
            p.vtens[k] = parseNum(cell(row, iVt));
            p.refTens[k] = parseNum(cell(row, iRef));
            p.bottomTemp[k] = parseNum(cell(row, iBot));
            p.fieldTemp[k] = parseNum(cell(row, iField));
            p.boxTemp[k] = parseNum(cell(row, iBox));
            for (int d = 0; d < 3; d++) {
                p.echo[d][k] = parseNum(cell(row, iEcho[d]));
                p.mps[d][k] = parseNum(cell(row, iMps[d]));
                p.ec[d][k] = parseNum(cell(row, iEc[d]));
                p.temp[d][k] = parseNum(cell(row, iTemp[d]));
            }
            k++;
        }
        trim(p, k);
        return p;
    }

    public Tables.Weather asWeather(ParsedTable table) {
        Cols cols = new Cols(table.headers);
        int iT = cols.find("timestamp", "datetime", "time", "时间", "z616509");
        int iP = cols.find("precipitation", "precip", "降雨", "降水量");
        int iTair = cols.find("airtemperature", "tair", "气温");
        int iRh = cols.find("relativehumidity", "rh", "相对湿度");
        int iRs = cols.find("solarradiation", "rs", "辐射", "太阳总辐射");
        int iWind = cols.find("windspeed", "wind", "风速");
        if (iT < 0) throw new IllegalArgumentException("气象文件需要时间列。");
        Tables.Weather w = new Tables.Weather();
        int n = table.rows.size();
        w.t = new long[n];
        w.precip = new double[n];
        w.airT = new double[n];
        w.rh = new double[n];
        w.rs = new double[n];
        w.wind = new double[n];
        int k = 0;
        for (String[] row : table.rows) {
            Long t = parseTime(cell(row, iT));
            if (t == null) continue;
            w.t[k] = t;
            w.precip[k] = parseNum(cell(row, iP));
            w.airT[k] = parseNum(cell(row, iTair));
            double rh = parseNum(cell(row, iRh));
            if (Double.isFinite(rh) && rh <= 1.5) rh *= 100;
            w.rh[k] = rh;
            w.rs[k] = parseNum(cell(row, iRs));
            w.wind[k] = parseNum(cell(row, iWind));
            k++;
        }
        trim(w, k);
        detectCumulativePrecip(w);
        return w;
    }

    private void detectCumulativePrecip(Tables.Weather w) {
        int inc = 0, dec = 0;
        double last = Double.NaN;
        for (double v : w.precip) {
            if (!Double.isFinite(v)) continue;
            if (Double.isFinite(last)) {
                if (v > last + 1e-6) inc++;
                if (v + 0.05 < last) dec++;
            }
            last = v;
        }
        if (inc > 20 && dec < inc / 8) {
            double[] d = new double[w.n()];
            last = Double.NaN;
            for (int i = 0; i < w.n(); i++) {
                double v = w.precip[i];
                if (!Double.isFinite(v)) { d[i] = Double.NaN; continue; }
                if (!Double.isFinite(last) || v + 0.05 < last) d[i] = Math.max(0, v);
                else d[i] = Math.max(0, v - last);
                last = v;
            }
            w.precip = d;
        }
    }

    private ParsedTable readCsv(byte[] bytes) throws IOException {
        List<String> lines = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (!line.isBlank()) lines.add(line.replace("\uFEFF", ""));
            }
        }
        if (lines.isEmpty()) throw new IllegalArgumentException("空文件。");
        char sep = guessSep(lines.get(0));
        List<String> headers = split(lines.get(0), sep);
        int start = 1;
        if (start < lines.size() && looksLikeLabelRow(split(lines.get(start), sep))) start++;
        List<String[]> rows = new ArrayList<>();
        for (int i = start; i < lines.size(); i++) {
            List<String> cells = split(lines.get(i), sep);
            rows.add(cells.toArray(String[]::new));
        }
        return new ParsedTable(headers, rows);
    }

    private ParsedTable readXlsx(byte[] bytes) throws IOException {
        try (InputStream in = new ByteArrayInputStream(bytes); Workbook wb = new XSSFWorkbook(in)) {
            Sheet sheet = wb.getSheetAt(0);
            Row h0 = sheet.getRow(0);
            Row h1 = sheet.getRow(1);
            List<String> headers = new ArrayList<>();
            int nCol = h0 == null ? 0 : h0.getLastCellNum();
            for (int c = 0; c < nCol; c++) {
                String a = cellStr(h0, c);
                String b = h1 == null ? "" : cellStr(h1, c);
                if (c == 0 && (a.toLowerCase(Locale.ROOT).startsWith("z6") || a.isBlank())) {
                    headers.add("Timestamp");
                } else if ("Timestamp".equalsIgnoreCase(b) || "时间".equals(b)) {
                    headers.add("Timestamp");
                } else {
                    headers.add(a.isBlank() ? b : a);
                }
            }
            int start = 1;
            Row r1 = sheet.getRow(1);
            if (r1 != null && looksLikeUnitRow(r1)) start = 2;
            Row r2 = sheet.getRow(2);
            if (r2 != null && looksLikeLabelRow(rowStrings(r2, nCol))) start = Math.max(start, 3);
            List<String[]> rows = new ArrayList<>();
            for (int r = start; r <= sheet.getLastRowNum(); r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;
                String[] cells = new String[nCol];
                boolean any = false;
                for (int c = 0; c < nCol; c++) {
                    cells[c] = cellStr(row, c);
                    if (!cells[c].isBlank()) any = true;
                }
                if (any) rows.add(cells);
            }
            return new ParsedTable(headers, rows);
        }
    }

    private boolean looksLikeUnitRow(Row row) {
        String a = cellStr(row, 0);
        return a.equalsIgnoreCase("timestamp") || a.contains("°") || a.contains("m s");
    }

    private boolean looksLikeLabelRow(List<String> cells) {
        int hits = 0;
        for (String c : cells) {
            if (c.contains("时间") || c.contains("质量") || c.contains("含水量") || c.contains("气温")) hits++;
        }
        return hits >= 2;
    }

    private List<String> rowStrings(Row row, int nCol) {
        List<String> out = new ArrayList<>();
        for (int c = 0; c < nCol; c++) out.add(cellStr(row, c));
        return out;
    }

    private String cellStr(Row row, int c) {
        if (row == null) return "";
        Cell cell = row.getCell(c);
        if (cell == null) return "";
        CellType t = cell.getCellType();
        if (t == CellType.NUMERIC) {
            if (DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toString().replace('T', ' ');
            }
            double v = cell.getNumericCellValue();
            if (v > 20000 && v < 80000 && (c == 0)) {
                LocalDateTime dt = DateUtil.getLocalDateTime(v);
                return dt.toString().replace('T', ' ');
            }
            if (v == Math.rint(v) && Math.abs(v) < 1e12) return Long.toString((long) v);
            return Double.toString(v);
        }
        if (t == CellType.BOOLEAN) return Boolean.toString(cell.getBooleanCellValue());
        String s = cell.toString();
        return s == null ? "" : s.trim();
    }

    private char guessSep(String header) {
        int c = count(header, ',');
        int s = count(header, ';');
        int t = count(header, '\t');
        if (s > c && s >= t) return ';';
        if (t > c) return '\t';
        return ',';
    }

    private int count(String s, char ch) {
        int n = 0;
        for (int i = 0; i < s.length(); i++) if (s.charAt(i) == ch) n++;
        return n;
    }

    private List<String> split(String line, char sep) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean q = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (q) {
                if (ch == '"') {
                    if (i + 1 < line.length() && line.charAt(i + 1) == '"') {
                        cur.append('"');
                        i++;
                    } else q = false;
                } else cur.append(ch);
            } else if (ch == '"') q = true;
            else if (ch == sep) {
                out.add(cur.toString().trim());
                cur.setLength(0);
            } else cur.append(ch);
        }
        out.add(cur.toString().trim());
        return out;
    }

    private String cell(String[] row, int i) {
        if (i < 0 || i >= row.length) return "";
        return row[i];
    }

    public static Long parseTime(String raw) {
        if (raw == null) return null;
        String s = raw.trim();
        if (s.isEmpty() || s.equalsIgnoreCase("nan")) return null;
        if (s.contains("T")) s = s.replace('T', ' ');
        if (s.length() > 23) s = s.substring(0, 23);
        for (DateTimeFormatter f : TIMES) {
            try {
                LocalDateTime dt = LocalDateTime.parse(s, f);
                return dt.toInstant(ZoneOffset.UTC).toEpochMilli();
            } catch (DateTimeParseException ignored) {
            }
        }
        try {
            double v = Double.parseDouble(s);
            if (v > 20000 && v < 80000) {
                LocalDateTime dt = DateUtil.getLocalDateTime(v);
                return dt.toInstant(ZoneOffset.UTC).toEpochMilli();
            }
        } catch (NumberFormatException ignored) {
        }
        return null;
    }

    public static double parseNum(String raw) {
        if (raw == null) return Double.NaN;
        String s = raw.trim();
        if (s.isEmpty() || s.equalsIgnoreCase("nan") || s.equalsIgnoreCase("na") || s.equalsIgnoreCase("null")) {
            return Double.NaN;
        }
        try {
            double v = Double.parseDouble(s);
            if (Math.abs(v) >= 9000) return Double.NaN;
            return v;
        } catch (NumberFormatException e) {
            return Double.NaN;
        }
    }

    private void trim(Tables.Weight w, int k) {
        w.t = java.util.Arrays.copyOf(w.t, k);
        w.lyw = java.util.Arrays.copyOf(w.lyw, k);
        w.sww = java.util.Arrays.copyOf(w.sww, k);
        w.pumpIn = java.util.Arrays.copyOf(w.pumpIn, k);
        w.pumpOut = java.util.Arrays.copyOf(w.pumpOut, k);
    }

    private void trim(Tables.Probe p, int k) {
        p.t = java.util.Arrays.copyOf(p.t, k);
        p.vtens = java.util.Arrays.copyOf(p.vtens, k);
        p.refTens = java.util.Arrays.copyOf(p.refTens, k);
        p.bottomTemp = java.util.Arrays.copyOf(p.bottomTemp, k);
        p.fieldTemp = java.util.Arrays.copyOf(p.fieldTemp, k);
        p.boxTemp = java.util.Arrays.copyOf(p.boxTemp, k);
        for (int d = 0; d < 3; d++) {
            p.echo[d] = java.util.Arrays.copyOf(p.echo[d], k);
            p.mps[d] = java.util.Arrays.copyOf(p.mps[d], k);
            p.ec[d] = java.util.Arrays.copyOf(p.ec[d], k);
            p.temp[d] = java.util.Arrays.copyOf(p.temp[d], k);
        }
    }

    private void trim(Tables.Weather w, int k) {
        w.t = java.util.Arrays.copyOf(w.t, k);
        w.precip = java.util.Arrays.copyOf(w.precip, k);
        w.airT = java.util.Arrays.copyOf(w.airT, k);
        w.rh = java.util.Arrays.copyOf(w.rh, k);
        w.rs = java.util.Arrays.copyOf(w.rs, k);
        w.wind = java.util.Arrays.copyOf(w.wind, k);
    }

    static class Cols {
        final Map<String, Integer> map = new LinkedHashMap<>();

        Cols(List<String> headers) {
            for (int i = 0; i < headers.size(); i++) {
                String n = norm(headers.get(i));
                map.putIfAbsent(n, i);
            }
        }

        int find(String... keys) {
            for (String k : keys) {
                String n = norm(k);
                if (map.containsKey(n)) return map.get(n);
            }
            for (String k : keys) {
                String n = norm(k);
                for (Map.Entry<String, Integer> e : map.entrySet()) {
                    if (e.getKey().contains(n) && n.length() >= 4) return e.getValue();
                }
            }
            return -1;
        }

        static String norm(String s) {
            String x = s == null ? "" : s.toLowerCase(Locale.ROOT);
            int p = x.indexOf('(');
            if (p > 0) x = x.substring(0, p);
            return NON_ALNUM.matcher(x).replaceAll("");
        }
    }
}
