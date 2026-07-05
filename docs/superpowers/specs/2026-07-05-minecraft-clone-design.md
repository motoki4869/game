# マイクラ風ボクセルサバイバルゲーム 設計

## 概要

`game/Minecraft` に、既存の `game/Tetris` と同じ構成（React + Vite + Tailwind CSS）をベースに、Three.js を用いたブラウザ動作のボクセル型サバイバルゲームを新規実装する。本家 Minecraft の完全再現ではなく、「歩き回る・ブロックを壊す/置く・生き延びる」というコア体験に、体力/空腹度・昼夜サイクル・簡易な敵・インベントリとクラフトを加えたスコープに絞る。

## スコープ

含む:
- 固定サイズの島（64×64ブロック程度）を Perlin noise で自動生成
- ブロック 10〜15種類（土・石・丸太・木材・葉・砂・水・石炭鉱石・鉄鉱石など）
- 一人称視点での移動・視点操作（本家PC版と同じ操作感）
- ブロックの破壊・設置（レイキャスト）
- 体力・空腹度、昼夜サイクル、夜間に出現する簡易な敵Mob（接触ダメージ）
- ホットバー＋インベントリ、3×3クラフトと木/石ツールの階層
- localStorage への自動保存・復元

含まない（将来拡張の余地はあるが今回は対象外）:
- 無限地形生成・マルチプレイヤー・レッドストーン・エンチャント・複雑な鉱石精錬(かまど)チェーン・多様なMob種

## 技術構成

- React 19 + Vite + Tailwind CSS（既存 `game/Tetris` と同一パターン）
- 3D描画: Three.js（`@react-three/fiber` + `@react-three/drei`）
- 状態管理: Zustand
- テスト: Vitest（純粋ロジックのみ）

## プロジェクト構造

```
game/Minecraft/
├── src/
│   ├── main.jsx
│   ├── App.jsx                 # Canvas全体のマウント、UI(HUD)のオーバーレイ
│   ├── world/
│   │   ├── terrainGenerator.js # Perlin noiseで高さマップ生成 → ブロックID配列
│   │   ├── worldStore.js       # ブロックデータ(Map<"x,y,z", blockId>)、差分管理
│   │   └── chunkMesh.js        # ボクセル→メッシュ変換(隣接面カリングで軽量化)
│   ├── player/
│   │   ├── PlayerController.jsx # WASD移動、重力、AABB衝突判定
│   │   └── PointerLockControls.jsx
│   ├── interaction/
│   │   └── useBlockRaycast.js  # カメラ前方レイキャストで対象ブロック取得、破壊/設置
│   ├── entities/
│   │   └── Mob.jsx             # 敵Mobの簡易AI(プレイヤーに向かって徘徊/接近)
│   ├── survival/
│   │   ├── useHealth.js        # 体力・空腹度・ダメージ処理
│   │   └── useDayNightCycle.js # 時刻進行、光源の色/強度変化
│   ├── inventory/
│   │   ├── inventoryStore.js   # ホットバー+インベントリのZustand store
│   │   ├── craftingRecipes.js  # レシピ定義とマッチング判定
│   │   └── ui/ (InventoryUI, CraftingUI, Hotbar, HUD)
│   ├── persistence/
│   │   └── saveGame.js         # localStorage読み書き、バージョン管理
│   └── constants/
│       └── blocks.js           # ブロック定義(id, 名前, テクスチャ色, 硬さ, ドロップアイテム)
├── public/
├── index.html
├── package.json / vite.config.js / tailwind.config.js
```

**設計判断**: ボクセルは1ブロック=1メッシュではなく、隣接する空気ブロックとの境界面だけを描画する簡易グリーディメッシュ的手法で軽量化する。64×64×高さ規模であれば十分実用的な負荷に収まる。

## データフロー・状態管理

Zustandで3つの独立したストアに分割し、責務を明確にする。

- **`worldStore`**: 地形の初期生成結果（読み取り専用ベース）＋プレイヤーが変更した差分（`Map<"x,y,z", blockId | null>`）を保持。ブロック破壊/設置時のみ更新され、`chunkMesh`がこの変更を検知して該当領域のメッシュだけ再構築する（全体再構築はしない）。
- **`playerStore`**: 位置・向き・体力・空腹度を保持。`PlayerController`が毎フレーム位置を更新し、`useHealth`が空腹度に応じて体力を増減させる。
- **`inventoryStore`**: ホットバー9枠＋インベントリ枠のアイテムとスタック数。ブロック破壊時に`worldStore`からのイベントを受けてアイテムを追加、クラフト時にレシピ消費/生成を行う。

**フロー例（ブロック破壊）**:
`useBlockRaycast`がクリックを検知 → 対象座標のブロックIDを`worldStore`から取得 → `worldStore.removeBlock(pos)` → `inventoryStore.addItem(dropItemOf(blockId))` → `chunkMesh`が差分を検知し再描画。

**永続化**: 上記3ストアの状態をまとめて5秒間隔のデバウンス＋`beforeunload`で`localStorage`に保存。読み込み時は保存データがあれば`terrainGenerator`の初期生成結果に差分を上書きして復元する。

## エラーハンドリング

- WebGL非対応ブラウザ: Three.jsのCanvas初期化前にWebGL対応チェックを行い、非対応なら「このブラウザは3D表示に対応していません」という代替メッセージを表示する（真っ白画面を防ぐ）。
- localStorage容量超過/読み込み失敗: `try/catch`で捕捉し、保存失敗時はコンソール警告のみ（ゲームは継続、次回保存時に再試行）。壊れた保存データ（JSONパース失敗やバージョン不一致）は破棄して新規ワールド生成にフォールバックする。
- 不正なクラフト操作（材料不足など）: UI側で事前にレシピ充足チェックを行い、そもそも実行不可にする（エラー表示は不要）。

## テスト方針

- 純粋ロジック（`terrainGenerator`、`craftingRecipes`のマッチング判定、`saveGame`のシリアライズ/デシリアライズ、体力・空腹度の増減計算）はVitestでユニットテストを書く。
- 描画・操作系（Three.jsのシーン、Pointer Lock、レイキャスト）は自動テスト対象外とし、プレビューでの手動確認で検証する（移動・破壊/設置・クラフト・昼夜サイクル・敵Mobとの接触・保存→リロード復元の一連の動作を確認）。

## 容量に関する補足

このプロジェクトは `~/Desktop/GitHub/game/` 配下、すなわち iCloud Drive の「デスクトップと書類フォルダ」同期対象内に置かれる。`node_modules` は `.gitignore` でGit管理からは除外されるが、iCloud同期そのものは止まらないため、依存インストール後は数百MB程度がiCloudにも同期される（ユーザー確認済み、許容とする）。
