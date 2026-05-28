#!/usr/bin/env python3
"""POST /api/upload 端到端 smoke。
用法: BASE=http://localhost:8082 ADMIN_PASS=<admin password> python3 tests/upload_smoke.py
"""
import json, os, sys, urllib.request, urllib.error, uuid

BASE = os.environ.get("BASE", "http://localhost:8082")
USER = os.environ.get("ADMIN_USER", "admin")
PASS = os.environ.get("ADMIN_PASS", "admin123")
SAMPLE = os.environ.get("SAMPLE_PNG", "docs/screenshots/02-dashboard.png")

results = []

def req(method, path, token=None, body=None, raw=None, ct=None):
    r = urllib.request.Request(
        BASE + path,
        data=raw if raw is not None else (json.dumps(body).encode() if body is not None else None),
        method=method,
    )
    r.add_header("Content-Type", ct or "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()

def chk(name, ok, detail=""):
    results.append((name, ok))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name} {detail}")

def multipart(fname, content, mime):
    bd = "----" + uuid.uuid4().hex
    body = (
        f"--{bd}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{fname}"\r\n'
        f"Content-Type: {mime}\r\n\r\n"
    ).encode() + content + f"\r\n--{bd}--\r\n".encode()
    return body, f"multipart/form-data; boundary={bd}"

# 登录
_, body = req("POST", "/api/auth/login", body={"username": USER, "password": PASS})
try:
    token = json.loads(body).get("token")
except Exception:
    token = None
chk("login", bool(token), f"as {USER}")
if not token:
    print("!! 登录失败，无法继续"); sys.exit(1)

# 1. 正常 PNG
with open(SAMPLE, "rb") as f:
    data = f.read()
body, ct = multipart("dashboard.png", data, "image/png")
st, resp = req("POST", "/api/upload", token=token, raw=body, ct=ct)
ok = st == 200
chk("正常 PNG 上传 200", ok, f"status={st}")
url = None
if ok:
    j = json.loads(resp)
    url = j["url"]
    chk("返回 url/filename/size/mime", all(k in j for k in ("url", "filename", "size", "mime")))
    # 2. 静态 serve 下载验证
    s, d = req("GET", url, token=token)
    chk("GET 静态 serve 200 + 字节一致", s == 200 and d == data, f"status={s} bytes={len(d)}")

# 3. 未登录拒绝
body, ct = multipart("x.png", b"hi", "image/png")
st, _ = req("POST", "/api/upload", raw=body, ct=ct)
chk("无 token 拒绝 401", st == 401, f"status={st}")

# 4. 错误 MIME 拒绝
body, ct = multipart("x.sh", b"#!/bin/sh\nexit 0\n", "text/plain")
st, resp = req("POST", "/api/upload", token=token, raw=body, ct=ct)
chk("非白名单 MIME 拒绝 415", st == 415, f"status={st}")

# 5. 缺 file 字段
st, _ = req("POST", "/api/upload", token=token, raw=b"--boundary--\r\n", ct="multipart/form-data; boundary=boundary")
chk("缺 file 字段 400", st == 400, f"status={st}")

passed = sum(1 for _, ok in results if ok)
print(f"\n== upload smoke: {passed}/{len(results)} PASS ==")
sys.exit(0 if passed == len(results) else 1)
