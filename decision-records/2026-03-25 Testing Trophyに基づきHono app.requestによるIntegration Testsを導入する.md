---
tags:
  - DecisionRecord
date: 2026-03-25
---

# Testing Trophy に基づき Hono app.request() による Integration Tests を導入する

## Status

Accepted

## Context

Testing Trophy に基づく分析で、Static Analysis（TypeScript strict mode + Biome）と Unit Tests（cache.ts, list-cache.ts の15テスト）は充実していたが、最も ROI が高い Integration Tests が完全に欠落していた。

プロキシサーバーのコア機能である以下の領域が未テストであり、品質リスクがあった：

- リクエスト転送（GET/POST/PUT/DELETE）
- リクエスト・レスポンスのヘッダー加工（プロキシ固有ヘッダーの除去）
- キャッシュ統合（キャッシュヒット/ミス時の動作）
- エラーハンドリング（fetch 失敗時の 502 レスポンス）

検討したアプローチ：

- **Hono app.request() によるアプリ内テスト**: HTTP サーバー起動不要、高速、冪等性が高い
- **ローカルサーバー起動型テスト**: 実 HTTP 通信を検証できるが、ポート管理やサーバーライフサイクルの複雑さがある

## Decision

Hono の `app.request()` を使った Integration Tests を導入する。

具体的な実装方針：

- `serveCommand.run()` 内の Hono アプリ生成ロジックを `createProxyApp(baseUrl, cacheDir)` 関数として抽出し、テストから直接インポート可能にする
- `globalThis.fetch` を Vitest の `vi.stubGlobal` でモックし、外部通信への依存を排除する
- ファイル I/O は実ファイルシステムを使用し、テストごとに一時ディレクトリを作成・破棄して冪等性を担保する
- 追加の npm 依存は導入せず、既存の Vitest + Hono 組み込みテストユーティリティで完結させる

このアプローチを選択した理由：

- 追加依存ゼロで始められる
- 実行が高速（数ms/テスト）で冪等性が保ちやすい
- Testing Trophy の最大部分である Integration Tests を最小コストで構築できる

## Consequences

### Positive

- プロキシの転送・ヘッダー加工・キャッシュ統合が検証可能になった（9テスト追加、全24テストパス）
- 追加の npm 依存なしで実現できた
- テストヘルパー（`createMockFetch`, `setupIntegrationTest`）により、今後の Integration テスト追加が容易
- `createProxyApp` の抽出により、アプリケーションロジックとサーバー起動ロジックが分離され、コードの見通しも改善された

### Negative

- 実 HTTP 通信は検証できない（サーバー起動、ネットワーク層の問題は E2E テストの領域）
- `fetch` をモックしているため、実際の外部 API との通信互換性は保証されない
