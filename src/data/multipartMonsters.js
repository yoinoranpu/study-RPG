// パーツ分けイラストを持つモンスター（まずはフェンリルで検証）。
// 体・前脚・後脚・尻尾を別々に描画し、脚の付け根を軸に回転させて歩行アニメーションを作る。
// 前脚・後脚それぞれ1枚しかないので、同じ画像を「奥側(やや小さく・位置ズラし)」「手前側」の
// 2回描画することで4本脚に見せる。左右の複製画像を新たに用意する必要はない。
// anchor座標は体画像のサイズに対する比率（0〜1）。見た目がズレていたら数値を微調整する。
// faceRight: 元イラストの顔の向き。falseなら描画時に左右反転してプレイヤー側(右)を向かせる。
export const MULTIPART_MONSTERS = {
  fenrir: {
    body:     "/assets/images/フェンリル_胴体.png",
    frontLeg: "/assets/images/フェンリル_前脚.png",
    backLeg:  "/assets/images/フェンリル_後脚.png",
    tail:     "/assets/images/フェンリル_尻尾.png",
    faceRight: false,
    // 体画像内でのアタッチ位置（お腹のライン＝脚の付け根の高さに合わせる）
    // RigEditorでユーザーが実際に調整した最終値
    frontLegAnchor: { x:0.48, y:0.64 },
    backLegAnchor:  { x:0.84, y:0.67 },
    tailAnchor:     { x:0.88, y:0.63 },
    // 各パーツ画像自身の中での回転軸（付け根の位置。画像を見て調整する）
    frontLegPivot: { x:0.50, y:0.02 },
    backLegPivot:  { x:0.34, y:0.05 },
    tailPivot:     { x:0.07, y:0.38 },
  },
  // フェンリルと同じ体型（獣・4足）なので、フェンリルの最終調整値を初期値として流用する。
  // RigEditorで微調整すれば十分なはず。
  wolf: {
    body:     "/assets/images/オオカミ体.png",
    frontLeg: "/assets/images/オオカミ前足.png",
    backLeg:  "/assets/images/オオカミ後足.png",
    tail:     "/assets/images/オオカミしっぽ.png",
    faceRight: false,
    // RigEditorでユーザーが実際に調整した最終値
    frontLegAnchor: { x:0.50, y:0.58 },
    backLegAnchor:  { x:0.85, y:0.58 },
    tailAnchor:     { x:0.91, y:0.43 },
    frontLegPivot: { x:0.50, y:0.02 },
    backLegPivot:  { x:0.34, y:0.05 },
    tailPivot:     { x:0.07, y:0.38 },
  },
  // ダイアウルフ・血狼の首領は元イラストの顔が最初から右向き（フェンリル/オオカミは左向き）だったため、
  // faceRight:falseで左右反転すると逆向きになってしまっていた。faceRight:trueに修正済み。
  dire_wolf: {
    body:     "/assets/images/ダイアウルフ胴体.png",
    frontLeg: "/assets/images/ダイアウルフ前足.png",
    backLeg:  "/assets/images/ダイアウルフ後ろ足.png",
    tail:     "/assets/images/ダイアウルフしっぽ.png",
    faceRight: true,
    // RigEditorでユーザーが実際に調整した最終値
    frontLegAnchor: { x:0.46, y:0.68 },
    backLegAnchor:  { x:0.06, y:0.60 },
    tailAnchor:     { x:0.06, y:0.53 },
    frontLegPivot: { x:0.70, y:0.15 },
    backLegPivot:  { x:0.40, y:0.14 },
    tailPivot:     { x:0.89, y:0.21 },
  },
  blood_wolf_chief: {
    body:     "/assets/images/血狼の首領胴体.png",
    frontLeg: "/assets/images/血狼の首領前足.png",
    backLeg:  "/assets/images/血狼の首領後ろ足.png",
    tail:     "/assets/images/血狼の首領しっぽ.png",
    faceRight: true,
    // RigEditorでユーザーが実際に調整した最終値
    frontLegAnchor: { x:0.13, y:0.52 },
    backLegAnchor:  { x:0.57, y:0.64 },
    tailAnchor:     { x:0.09, y:0.46 },
    frontLegPivot: { x:0.38, y:0.02 },
    backLegPivot:  { x:0.64, y:0.05 },
    tailPivot:     { x:0.89, y:0.14 },
  },
  // イノシシは体型が少しずんぐりしているので、脚の付け根をやや高めの初期値にしてある。
  armored_boar: {
    body:     "/assets/images/イノシシ(星2)胴体.png",
    frontLeg: "/assets/images/イノシシ(星2)前足.png",
    backLeg:  "/assets/images/イノシシ(星2)後ろ足.png",
    tail:     "/assets/images/イノシシ(星2)しっぽ.png",
    faceRight: false,
    frontLegAnchor: { x:0.45, y:0.60 },
    backLegAnchor:  { x:0.82, y:0.62 },
    tailAnchor:     { x:0.90, y:0.55 },
    frontLegPivot: { x:0.50, y:0.02 },
    backLegPivot:  { x:0.34, y:0.05 },
    tailPivot:     { x:0.20, y:0.30 },
  },
};

// パーツ分け不要・1枚絵だけで表現するモンスター（粘体系など）。
// 描画側は縦横比を変える潰れ・伸び・バウンドをcanvas変形だけで行う。
export const SIMPLE_IMAGE_MONSTERS = {
  slime: "/assets/images/スライム.png",
  giant_slime: "/assets/images/巨大スライム.png",
  acid_slime: "/assets/images/酸スライム.png",
  abyss_slime: "/assets/images/深淵スライム.png",
};

// 複数の1枚絵を同時に描画するモンスター（スライム軍団など、群れとして見せたいもの）。
// dx: 中心からのXオフセット（sizeに対する比率）、scale: 基準サイズに対する縮尺、phase: バウンドの位相ズレ。
export const GROUP_IMAGE_MONSTERS = {
  slime_army: [
    { src: "/assets/images/スライム軍団小.png", dx: -0.85, scale: 0.5,  phase: 0.6 },
    { src: "/assets/images/スライム軍団大.png", dx: 0,     scale: 0.85, phase: 0 },
    { src: "/assets/images/スライム軍団中.png", dx: 0.85,  scale: 0.65, phase: 1.3 },
  ],
};

// パーツ分け不要・1枚絵だけで表現するモンスター（植物系）。
// 脚を持たず歩かないので、根元付近の1点(pivot)を軸に画像全体をわずかに回転させるだけ。
// pivotは画像自身のサイズに対する比率（0〜1）。根元(幹が地面に接するあたり)を想定。
export const SWAY_IMAGE_MONSTERS = {
  moss_slime:  { src: "/assets/images/苔スライム.png",     pivot: { x:0.5, y:0.90 } },
  world_tree:  { src: "/assets/images/世界樹の苗木.png",   pivot: { x:0.5, y:0.92 } },
  man_eater:   { src: "/assets/images/食人植物.png",       pivot: { x:0.5, y:0.90 } },
  cursed_tree: { src: "/assets/images/古の魔樹.png",       pivot: { x:0.5, y:0.92 } },
};

// パーツ分け不要・1枚絵だけで表現するモンスター（不死系など、脚を持たずゆっくり上下浮遊するだけのもの）。
// 潰れ・伸びなし、回転なし。単純に上下にフワフワ浮くだけ。
export const FLOAT_IMAGE_MONSTERS = {
  death_knight: "/assets/images/デスナイト.png",
};

// 体は浮遊するだけ・その体に腕や剣などの付属パーツをアンカー+ピボットで取り付けて個別に揺らすモンスター。
// 獣系のMULTIPART_MONSTERSと似ているが、歩行(walking)の概念がなく常に浮遊系の揺れになる点が違う。
// parts配列の各要素: img(画像パス), anchor(体に対する取り付け位置0〜1), pivot(パーツ自身内の回転軸0〜1),
// phase(揺れの位相ズレ), swingAmp(揺れ幅、省略時0.12), mirror(左右反転して描くか), behind(体より奥に描くか)
export const FLOAT_RIG_MONSTERS = {
  skeleton: {
    body: "/assets/images/スケルトン体.png",
    faceRight: true,
    parts: [
      { key:"armLeft",  img:"/assets/images/スケルトン左腕.png", anchor:{x:0.28,y:0.24}, pivot:{x:0.5,y:0.04}, phase:0,   swingAmp:0.10, behind:true },
      { key:"armRight", img:"/assets/images/スケルトン右腕.png", anchor:{x:0.72,y:0.24}, pivot:{x:0.5,y:0.04}, phase:1.2, swingAmp:0.10, behind:true },
      { key:"legLeft",  img:"/assets/images/スケルトン足.png",   anchor:{x:0.40,y:0.88}, pivot:{x:0.5,y:0.05}, phase:0,   swingAmp:0.08, behind:true },
      { key:"legRight", img:"/assets/images/スケルトン足.png",   anchor:{x:0.60,y:0.88}, pivot:{x:0.5,y:0.05}, phase:1.5, swingAmp:0.08, mirror:true, behind:true },
    ],
  },
  wraith_knight: {
    body: "/assets/images/亡霊騎士.png",
    faceRight: true,
    parts: [
      { key:"sword", img:"/assets/images/亡霊騎士剣.png", anchor:{x:0.68,y:0.40}, pivot:{x:0.08,y:0.5}, phase:0.5, swingAmp:0.06 },
    ],
  },
  fallen_queen: {
    body: "/assets/images/亡国の女王胴体.png",
    faceRight: true,
    // RigEditorでユーザーが実際に調整した最終値
    parts: [
      { key:"skirt", img:"/assets/images/亡国の女王下半身.png", anchor:{x:0.64,y:0.57}, pivot:{x:0.5,y:0.06}, phase:0, swingAmp:0.05, behind:true },
      { key:"arm",   img:"/assets/images/亡国の女王腕.png",     anchor:{x:1.07,y:0.37}, pivot:{x:0.5,y:0.05}, phase:1, swingAmp:0.10, behind:true },
    ],
  },
  // 堕天使はローブで脚が隠れており浮遊系。左右の翼が別画像で届いたのでミラーせずそのまま使う。
  // RigEditorでユーザーが実際に調整した最終値（翼は左右同位相=同じ挙動にして飛んでる感を出した）
  fallen_angel: {
    body: "/assets/images/堕天使.png",
    faceRight: true,
    parts: [
      { key:"arm",       img:"/assets/images/堕天使腕.png",   anchor:{x:0.38,y:0.34}, pivot:{x:0.81,y:0.16}, phase:0, swingAmp:0.08 },
      { key:"wingRight", img:"/assets/images/堕天使右翼.png", anchor:{x:0.45,y:0.36}, pivot:{x:0.90,y:0.31}, phase:0, swingAmp:0.15, behind:true },
      { key:"wingLeft",  img:"/assets/images/堕天使左翼.png", anchor:{x:0.63,y:0.34}, pivot:{x:0.16,y:0.46}, phase:0, swingAmp:0.15, behind:true },
    ],
  },
};

// 地面に立って歩くが獣系のような4足構成ではないモンスター（ゴブリン系など、二足+得物を持つ腕）。
// FLOAT_RIG_MONSTERSと同じparts配列形式だが、体は地面にアンカーされ、walkSwing:trueのパーツは
// 歩行中(walking)だけ大きく振れる（獣系の脚と同じ挙動）。walkSwing:falseのパーツは常に一定振幅で揺れる。
export const GROUND_RIG_MONSTERS = {
  // RigEditorでユーザーが実際に調整した最終値
  goblin: {
    body: "/assets/images/ゴブリン体.png",
    faceRight: true,
    parts: [
      { key:"armRight", img:"/assets/images/ゴブリン右腕.png", anchor:{x:0.25,y:0.47}, pivot:{x:0.53,y:0.11}, phase:0,   swingAmp:0.15 },
      { key:"armLeft",  img:"/assets/images/ゴブリン左腕.png", anchor:{x:0.67,y:0.43}, pivot:{x:0.10,y:0.49}, phase:0.8, swingAmp:0.15, behind:true },
      { key:"legRight", img:"/assets/images/ゴブリン右足.png", anchor:{x:0.42,y:0.81}, pivot:{x:0.65,y:0.12}, phase:0,        swingAmp:0.3,  walkSwing:true, behind:true },
      { key:"legLeft",  img:"/assets/images/ゴブリン左足.png", anchor:{x:0.62,y:0.81}, pivot:{x:0.14,y:0.10}, phase:Math.PI, swingAmp:0.26, walkSwing:true, behind:true },
    ],
  },
  goblin_king: {
    body: "/assets/images/ゴブリンキング体.png",
    faceRight: true,
    parts: [
      { key:"arm",      img:"/assets/images/ゴブリンキング腕.png",   anchor:{x:0.85,y:0.38}, pivot:{x:0.12,y:0.48}, phase:0, swingAmp:0.12, behind:true },
      { key:"legRight", img:"/assets/images/ゴブリンキング右足.png", anchor:{x:0.64,y:0.78}, pivot:{x:0.87,y:0},    phase:0,        swingAmp:0.3,  walkSwing:true, behind:true },
      { key:"legLeft",  img:"/assets/images/ゴブリンキング左足.png", anchor:{x:0.83,y:0.86}, pivot:{x:0.31,y:0.14}, phase:Math.PI, swingAmp:0.26, walkSwing:true, behind:true },
    ],
  },
  goblin_pope: {
    body: "/assets/images/ゴブリン教皇体.png",
    faceRight: true,
    parts: [
      { key:"staffArm", img:"/assets/images/ゴブリン教皇腕.png",   anchor:{x:0.12,y:0.38}, pivot:{x:0.84,y:0.43}, phase:0, swingAmp:0.08 },
      { key:"skirt",    img:"/assets/images/ゴブリン教皇下半身.png", anchor:{x:0.36,y:0.53}, pivot:{x:0.53,y:0.05}, phase:0.3, swingAmp:0.04, behind:true },
    ],
  },
  // ゴブリンシャーマン: ユーザー指定のレイヤー順（マント→体→手足→あたま→腰掛）で構成。
  // 「体に固定」と名付けられたパーツ(マント/頭/右手/腰掛)は独立して動かさずswingAmp:0で静止させ、
  // 実際に動くのは杖を持つ腕(腕)と両足(右足/左足)のみ。
  // 各パーツ画像は同じ制作バッチで統一された縮尺で描かれているため、scaleは基本1.0のままでよい
  // （content_px * scaleが実際の描画サイズになるため、キャンバスの余白量はサイズに影響しない）。
  // 「DEBUG: 汎用リグエディタ」で位置・faceRightを最終確認すること。
  goblin_shaman: {
    body: "/assets/images/ゴブリンシャーマン　体.png",
    faceRight: false,
    // 体画像が胴体だけ（頭・脚が完全に別パーツ）で全身像ではないため、
    // 通常のk=1.5だと胴体だけで他モンスター1体分くらいの大きさになってしまう。
    // 縮小してから頭・脚を組み立てることで全体のバランスを取る。
    bodyScaleK: 0.55,
    parts: [
      { key:"mantle",   img:"/assets/images/ゴブリンシャーマンマント　体に固定.png", anchor:{x:0.82,y:-0.30}, pivot:{x:0.50,y:0.00}, scale:1.0, swingAmp:0, behind:true },
      { key:"handFix",  img:"/assets/images/ゴブリンシャーマン右手　体に固定.png",   anchor:{x:1.30,y:0.66},  pivot:{x:0.27,y:0.27}, scale:1.0, swingAmp:0 },
      { key:"staffArm", img:"/assets/images/ゴブリンシャーマン腕.png",             anchor:{x:0.13,y:0.36},  pivot:{x:0.94,y:0.36}, scale:1.0, phase:0, swingAmp:0.08 },
      { key:"legRight", img:"/assets/images/ゴブリンシャーマン右足.png",           anchor:{x:0.14,y:1.01},  pivot:{x:0.81,y:0.09}, scale:1.0, phase:0,        swingAmp:0.28, walkSwing:true },
      { key:"legLeft",  img:"/assets/images/ゴブリンシャーマン左足.png",           anchor:{x:1.00,y:1.04},  pivot:{x:0.73,y:0.56}, scale:1.0, phase:Math.PI, swingAmp:0.24, walkSwing:true },
      { key:"head",     img:"/assets/images/ゴブリンシャーマン頭　体に固定.png",     anchor:{x:0.53,y:-0.08}, pivot:{x:0.50,y:0.55}, scale:1.0, swingAmp:0 },
      { key:"hipWrap",  img:"/assets/images/ゴブリンシャーマン　腰掛　体に固定.png", anchor:{x:0.58,y:0.69},  pivot:{x:0.50,y:0.00}, scale:1.0, swingAmp:0 },
    ],
  },
  // 悪魔系: 体は既に脚まで含んだ全身像として届いたので地面にアンカー。翼は1枚を左右反転して複製。
  // RigEditorでユーザーが実際に調整した最終値（翼は左右同位相=同じ挙動にして飛んでる感を出した）
  imp: {
    body: "/assets/images/インプ胴体.png",
    faceRight: true,
    parts: [
      { key:"wingLeft",  img:"/assets/images/インプ翼.png", anchor:{x:0.57,y:0.40}, pivot:{x:0.11,y:0.72}, phase:0, swingAmp:0.25, behind:true },
      { key:"wingRight", img:"/assets/images/インプ翼.png", anchor:{x:0.38,y:0.42}, pivot:{x:0.07,y:0.70}, phase:0, swingAmp:0.25, behind:true, mirror:true },
    ],
  },
  demon_soldier: {
    body: "/assets/images/魔界兵.png",
    faceRight: true,
    parts: [
      { key:"wingLeft",  img:"/assets/images/魔界兵翼.png", anchor:{x:0.56,y:0.31}, pivot:{x:0.13,y:0.45}, phase:0, swingAmp:0.2, behind:true },
      { key:"wingRight", img:"/assets/images/魔界兵翼.png", anchor:{x:0.27,y:0.32}, pivot:{x:0.07,y:0.44}, phase:0, swingAmp:0.2, behind:true, mirror:true },
    ],
  },
  imp_captain: {
    body: "/assets/images/小悪魔隊長.png",
    faceRight: true,
    parts: [
      { key:"wingLeft",  img:"/assets/images/小悪魔隊長翼.png", anchor:{x:0.59,y:0.27}, pivot:{x:0.11,y:0.50}, phase:0, swingAmp:0.22, behind:true },
      { key:"wingRight", img:"/assets/images/小悪魔隊長翼.png", anchor:{x:0.32,y:0.27}, pivot:{x:0.07,y:0.46}, phase:0, swingAmp:0.22, behind:true, mirror:true },
    ],
  },
  // 竜系: 体は頭+胴+尻尾が一体で届いた（コボルトは翼なしの小型爬虫類人型）。
  // 左右の腕・脚それぞれ別画像で届いたのでmirror不要、初期値は目視の best-effort。
  // 「DEBUG: 汎用リグエディタ」で位置を微調整すること。
  // RigEditorでユーザーが実際に調整した最終値
  kobold: {
    body: "/assets/images/コボルト体２.png",
    faceRight: true,
    parts: [
      { key:"armRight", img:"/assets/images/コボルト右手３.png", anchor:{x:0.11,y:0.32}, pivot:{x:0.76,y:0.13}, scale:1, phase:0,   swingAmp:0.10 },
      { key:"armLeft",  img:"/assets/images/コボルト左手１.png", anchor:{x:0.49,y:0.35}, pivot:{x:0.26,y:0.11}, scale:1, phase:1.2, swingAmp:0.10, behind:true },
      { key:"legRight", img:"/assets/images/コボルト右足３.png", anchor:{x:0.11,y:0.63}, pivot:{x:0.76,y:0.11}, scale:1, phase:0,        swingAmp:0.28, walkSwing:true },
      { key:"legLeft",  img:"/assets/images/コボルト左足１.png", anchor:{x:0.36,y:0.61}, pivot:{x:0.16,y:0.12}, scale:1, phase:Math.PI, swingAmp:0.24, walkSwing:true, behind:true },
    ],
  },
  // 火竜: 体画像に翼が既に描き込まれているため翼パーツは不要（はためきアニメなしで固定翼）。
  // 前脚は左右別画像、後脚は1枚のみ届いたのでmirror:trueで複製。尻尾は常時ゆるくスイング。
  fire_dragon: {
    body: "/assets/images/火竜体２.png",
    faceRight: true,
    // 体が大きい4足の竜は、狼系と同じ歩行周期(0.08)のままだと脚の振りが小刻みで
    // 落ち着きなく見える(違和感が強いとの指摘)。大型4足はゆっくり大きく踏み出す方が自然なため遅くする。
    walkSpeedMul: 0.6,
    parts: [
      { key:"tail",          img:"/assets/images/火竜しっぽ１.png",     anchor:{x:0.46,y:0.85}, pivot:{x:0.15,y:0.30}, scale:0.6, phase:0,   swingAmp:0.06, behind:true, mirror:true },
      { key:"frontLegRight", img:"/assets/images/火竜前足右３.png",     anchor:{x:0.73,y:0.85}, pivot:{x:0.5, y:0.05}, phase:0,        swingAmp:0.34, walkSwing:true },
      { key:"frontLegLeft",  img:"/assets/images/火竜前足左１.png",     anchor:{x:0.55,y:0.84}, pivot:{x:0.5, y:0.05}, phase:0,        swingAmp:0.34, walkSwing:true, behind:true },
      { key:"backLegRight",  img:"/assets/images/火竜脚１，３.png",      anchor:{x:0.50,y:0.88}, pivot:{x:0.5, y:0.05}, phase:Math.PI,  swingAmp:0.28, walkSwing:true },
      { key:"backLegLeft",   img:"/assets/images/火竜脚１，３.png",      anchor:{x:0.78,y:0.85}, pivot:{x:0.66,y:0.08}, phase:Math.PI,  swingAmp:0.28, walkSwing:true, behind:true },
    ],
  },
  // 若竜・黒竜: 新しいイラストを発注せず、火竜と全く同じパーツ画像をtint(ctx.filterのCSSフィルタ文字列)で
  // 色替えして流用する。ユーザー発案のRGBチャンネル入れ替え検証から発展し、実際は
  // hue-rotate/saturate/brightnessの組み合わせの方が発光色まで含めて自然に変換できたためこちらを採用。
  young_dragon: {
    body: "/assets/images/火竜体２.png",
    faceRight: true,
    tint: "hue-rotate(120deg) saturate(1.1) brightness(1.05)",
    walkSpeedMul: 0.6,
    parts: [
      { key:"tail",          img:"/assets/images/火竜しっぽ１.png",     anchor:{x:0.46,y:0.85}, pivot:{x:0.15,y:0.30}, scale:0.6, phase:0,   swingAmp:0.06, behind:true, mirror:true },
      { key:"frontLegRight", img:"/assets/images/火竜前足右３.png",     anchor:{x:0.73,y:0.85}, pivot:{x:0.5, y:0.05}, phase:0,        swingAmp:0.34, walkSwing:true },
      { key:"frontLegLeft",  img:"/assets/images/火竜前足左１.png",     anchor:{x:0.55,y:0.84}, pivot:{x:0.5, y:0.05}, phase:0,        swingAmp:0.34, walkSwing:true, behind:true },
      { key:"backLegRight",  img:"/assets/images/火竜脚１，３.png",      anchor:{x:0.50,y:0.88}, pivot:{x:0.5, y:0.05}, phase:Math.PI,  swingAmp:0.28, walkSwing:true },
      { key:"backLegLeft",   img:"/assets/images/火竜脚１，３.png",      anchor:{x:0.78,y:0.85}, pivot:{x:0.66,y:0.08}, phase:Math.PI,  swingAmp:0.28, walkSwing:true, behind:true },
    ],
  },
  black_dragon: {
    body: "/assets/images/火竜体２.png",
    faceRight: true,
    tint: "brightness(0.42) saturate(0.4) hue-rotate(255deg)",
    walkSpeedMul: 0.6,
    parts: [
      { key:"tail",          img:"/assets/images/火竜しっぽ１.png",     anchor:{x:0.46,y:0.85}, pivot:{x:0.15,y:0.30}, scale:0.6, phase:0,   swingAmp:0.06, behind:true, mirror:true },
      { key:"frontLegRight", img:"/assets/images/火竜前足右３.png",     anchor:{x:0.73,y:0.85}, pivot:{x:0.5, y:0.05}, phase:0,        swingAmp:0.34, walkSwing:true },
      { key:"frontLegLeft",  img:"/assets/images/火竜前足左１.png",     anchor:{x:0.55,y:0.84}, pivot:{x:0.5, y:0.05}, phase:0,        swingAmp:0.34, walkSwing:true, behind:true },
      { key:"backLegRight",  img:"/assets/images/火竜脚１，３.png",      anchor:{x:0.50,y:0.88}, pivot:{x:0.5, y:0.05}, phase:Math.PI,  swingAmp:0.28, walkSwing:true },
      { key:"backLegLeft",   img:"/assets/images/火竜脚１，３.png",      anchor:{x:0.78,y:0.85}, pivot:{x:0.66,y:0.08}, phase:Math.PI,  swingAmp:0.28, walkSwing:true, behind:true },
    ],
  },
};
