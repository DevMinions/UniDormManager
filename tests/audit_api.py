#!/usr/bin/env python3
"""逐接口实测后端 API（审核用）。非 curl/wget，纯 urllib。
用法: BASE=http://localhost:8082 python3 tests/audit_api.py
"""
import json, os, urllib.request, urllib.error, sys

BASE = os.environ.get("BASE", "http://localhost:8082")
results = []  # (domain, name, ok, detail)

def req(method, path, token=None, body=None, timeout=10):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=timeout) as resp:
            raw = resp.read().decode()
            try: parsed = json.loads(raw)
            except Exception: parsed = raw
            return resp.status, parsed
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try: parsed = json.loads(raw)
        except Exception: parsed = raw
        return e.code, parsed
    except Exception as e:
        return None, str(e)

def check(domain, name, cond, detail=""):
    results.append((domain, name, bool(cond), detail))
    mark = "PASS" if cond else "FAIL"
    print(f"  [{mark}] {domain}/{name} {detail}")

def listish(p):
    """提取列表长度，兼容 {data:[...]} / {items:[...]} / [...] / {data:{items/list:[...]}}"""
    if isinstance(p, list): return len(p)
    if isinstance(p, dict):
        for k in ("data", "items", "list", "rows"):
            v = p.get(k)
            if isinstance(v, list): return len(v)
            if isinstance(v, dict):
                for k2 in ("items", "list", "rows", "data"):
                    if isinstance(v.get(k2), list): return len(v[k2])
    return None

print(f"== 目标 {BASE} ==")

# ---- AUTH ----
st, body = req("POST", "/api/auth/login", body={"username": "admin", "password": "admin123"})
token = None
if st == 200 and isinstance(body, dict):
    token = body.get("token") or (body.get("data") or {}).get("token")
check("auth", "login", st == 200 and token, f"status={st} token={'有' if token else '无'}")
if not token:
    print("!! 登录失败，无法继续受保护接口测试");
    print(json.dumps(body, ensure_ascii=False)[:300])
    sys.exit(1)

st, _ = req("POST", "/api/auth/login", body={"username": "admin", "password": "wrongpw"})
check("auth", "login_bad_creds_rejected", st in (400, 401), f"status={st}")
st, _ = req("GET", "/api/students")  # 无 token
check("auth", "no_token_401", st in (401, 403), f"status={st}")
st, me = req("GET", "/api/auth/me", token)
check("auth", "me", st == 200, f"status={st}")

# ---- 只读列表/分页/子路由 ----
GET_TESTS = [
    ("users", "/api/users"), ("users", "/api/users/user-admin-1"),
    ("roles", "/api/roles"), ("permissions", "/api/permissions"),
    ("students", "/api/students/all"), ("students", "/api/students?page=1&pageSize=10"),
    ("buildings", "/api/buildings"),
    ("rooms", "/api/rooms/all"), ("rooms", "/api/rooms?page=1&pageSize=10"),
    ("repairs", "/api/repairs/all"), ("repairs", "/api/repairs?page=1&pageSize=10"),
    ("notices", "/api/notices"),
    ("dashboard", "/api/dashboard/stats"),
    ("statistics", "/api/statistics/repairs-by-day?days=7"),
    ("audit_logs", "/api/audit-logs?pageSize=5"),
    ("inspections", "/api/inspections?page=1&pageSize=10"), ("inspections", "/api/inspections/my?page=1&pageSize=10"),
    ("inspections", "/api/inspections/rooms"), ("inspections", "/api/inspections/rankings"),
    ("room_swaps", "/api/room-swaps"), ("room_swaps", "/api/room-swaps/my-applications"),
    ("room_swaps", "/api/room-swaps/pending"), ("room_swaps", "/api/room-swaps/history"),
    ("room_swaps", "/api/room-swaps/available"),
    ("access_logs", "/api/access-logs"), ("access_logs", "/api/access-logs/live"),
    ("late_returns", "/api/late-returns"), ("late_returns", "/api/late-returns/pending"),
    ("health", "/health"), ("metrics", "/metrics"),
]
for domain, path in GET_TESTS:
    st, body = req("GET", path, token)
    ln = listish(body)
    check(domain, "GET " + path, st == 200, f"status={st}" + (f" 列表={ln}" if ln is not None else ""))

# ---- 写闭环冒烟：buildings 创建→读→改→删（自清理）----
st, body = req("POST", "/api/buildings", token,
               {"name": "审核测试楼ZZ", "type": "Male", "floors": 6, "description": "audit temp", "manager": "测试管理员"})
bid = None
if isinstance(body, dict):
    bid = body.get("id") or (body.get("data") or {}).get("id")
check("buildings", "POST create", st in (200, 201) and bid, f"status={st} id={bid}")
if bid:
    st, _ = req("GET", f"/api/buildings/{bid}", token)
    check("buildings", "GET by id", st == 200, f"status={st}")
    st, _ = req("PUT", f"/api/buildings/{bid}", token,
                {"name": "审核测试楼ZZ-改", "type": "Female", "floors": 7, "description": "audit", "manager": "测试管理员"})
    check("buildings", "PUT update", st == 200, f"status={st}")
    st, _ = req("DELETE", f"/api/buildings/{bid}", token)
    check("buildings", "DELETE", st in (200, 204), f"status={st}")

# ---- 汇总 ----
total = len(results); passed = sum(1 for r in results if r[2])
print(f"\n== 汇总: {passed}/{total} 通过 ==")
fails = [r for r in results if not r[2]]
if fails:
    print("失败项:")
    for d, n, ok, det in fails:
        print(f"  - {d}/{n}  {det}")
# 机器可读
print("JSON_RESULT=" + json.dumps(
    {"passed": passed, "total": total,
     "fails": [{"domain": d, "name": n, "detail": det} for d, n, ok, det in fails]},
    ensure_ascii=False))
