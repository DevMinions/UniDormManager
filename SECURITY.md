# Security Policy / 安全策略

## Supported Versions / 受支持版本

Only the latest commit on the default branch (`main`) receives security updates.

只有默认分支（`main`）的最新 commit 会接收安全更新。

## Reporting a Vulnerability / 报告漏洞

**Please do NOT open a public GitHub issue for security vulnerabilities.**

**请不要以公开 issue 的方式报告安全漏洞。**

Use one of these private channels:

请使用以下私有渠道之一：

1. **GitHub Private Vulnerability Reporting**
   - Go to the [Security tab](../../security/advisories/new) of this repository
   - Click "Report a vulnerability"
   - This is the preferred way — encrypted, tracked, and only visible to maintainers.

2. **GitHub Security Advisory draft via direct message**
   - If private reporting is disabled, contact a maintainer via their GitHub profile.

When reporting, please include:

报告时请尽量包含：

- A clear description of the vulnerability / 漏洞描述
- Steps to reproduce / 复现步骤
- Affected component (backend / web / docker / docs / CI) / 受影响的组件
- Expected vs actual behavior / 期望行为与实际行为
- Suggested fix or patch (if any) / 建议的修复方式（如有）
- Your contact for follow-up (optional) / 后续沟通的联系方式（可选）

## Response Timeline / 响应时间

This is a community-maintained project. Best-effort response targets:

社区维护项目，尽力而为：

| Severity | Initial response | Fix target |
|----------|------------------|------------|
| Critical (RCE / auth bypass / data leak) | 48h | 7 days |
| High (privilege escalation / SQLi) | 5 days | 30 days |
| Medium / Low | 14 days | Next minor release |

## Disclosure / 披露

We follow coordinated disclosure: a fix lands on the default branch first, then we publish a GitHub Security Advisory crediting the reporter (unless anonymity is requested).

我们采用协调披露：修复先合入默认分支，随后发布 GitHub Security Advisory 并致谢报告者（如要求匿名则不署名）。
