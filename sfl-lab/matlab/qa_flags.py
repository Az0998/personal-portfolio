import json
import urllib.request

req = urllib.request.Request("http://127.0.0.1:8080/api/sessions/demo?kind=matlab", method="POST")
demo = json.loads(urllib.request.urlopen(req, timeout=60).read())
sid = demo["id"]
fp = json.loads(urllib.request.urlopen(f"http://127.0.0.1:8080/api/sessions/{sid}/flags/summary?stream=probe").read())
print("probe", fp["n0"], fp["n1"], fp["n2"])
print("reasons", json.dumps(fp["reasons"], ensure_ascii=False))
print("notes", demo.get("notes"))
