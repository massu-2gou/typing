// --- ゲーム設定 ---
const GAME_HEIGHT = 400;
const GOAL_SCORE = 500000;

let wordList; // 外部ファイルから読み込んだ単語リストを格納する変数
let meteors = []; // 隕石を管理する配列
let score = 0;
let inputBox;

// ゲームの状態を定数で管理する
const GAME_STATE = {
    PLAYING: 'playing',
    CLEARED: 'cleared',
    GAME_OVER: 'gameOver'
};
let gameState = GAME_STATE.PLAYING;

// ローマ字とひらがなの対応表
// 「ん」や「っ」などの特殊なケースも考慮すると複雑になるため、今回は基本的なマッピングのみ
const romajiMap = {
    'あ': ['a'], 'い': ['i'], 'う': ['u'], 'え': ['e'], 'お': ['o'],
    'か': ['ka'], 'き': ['ki'], 'く': ['ku'], 'け': ['ke'], 'こ': ['ko'],
    'さ': ['sa'], 'し': ['shi', 'si'], 'す': ['su'], 'せ': ['se'], 'そ': ['so'],
    'た': ['ta'], 'ち': ['chi', 'ti'], 'つ': ['tsu', 'tu'], 'て': ['te'], 'と': ['to'],
    'な': ['na'], 'に': ['ni'], 'ぬ': ['nu'], 'ね': ['ne'], 'の': ['no'],
    'は': ['ha'], 'ひ': ['hi'], 'ふ': ['fu', 'hu'], 'へ': ['he'], 'ほ': ['ho'],
    'ま': ['ma'], 'み': ['mi'], 'む': ['mu'], 'め': ['me'], 'も': ['mo'],
    'や': ['ya'], 'ゆ': ['yu'], 'よ': ['yo'],
    'ら': ['ra'], 'り': ['ri'], 'る': ['ru'], 'れ': ['re'], 'ろ': ['ro'],
    'わ': ['wa'], 'を': ['wo'], 'ん': ['n', 'nn'],
    'が': ['ga'], 'ぎ': ['gi'], 'ぐ': ['gu'], 'げ': ['ge'], 'ご': ['go'],
    'ざ': ['za'], 'じ': ['ji', 'zi'], 'ず': ['zu'], 'ぜ': ['ze'], 'ぞ': ['zo'],
    'だ': ['da'], 'ぢ': ['di'], 'づ': ['du'], 'で': ['de'], 'ど': ['do'],
    'ば': ['ba'], 'び': ['bi'], 'ぶ': ['bu'], 'べ': ['be'], 'ぼ': ['bo'],
    'ぱ': ['pa'], 'ぴ': ['pi'], 'ぷ': ['pu'], 'ぺ': ['pe'], 'ぽ': ['po'],
    'きゃ': ['kya'], 'きゅ': ['kyu'], 'きょ': ['kyo'],
    'しゃ': ['sha', 'sya'], 'しゅ': ['shu', 'syu'], 'しょ': ['sho', 'syo'],
    'ちゃ': ['cha', 'tya'], 'ちゅ': ['chu', 'tyu'], 'ちょ': ['cho', 'tyo'],
    'にゃ': ['nya'], 'にゅ': ['nyu'], 'にょ': ['nyo'],
    'ひゃ': ['hya'], 'ひゅ': ['hyu'], 'ひょ': ['hyo'],
    'みゃ': ['mya'], 'みゅ': ['myu'], 'みょ': ['myo'],
    'りゃ': ['rya'], 'りゅ': ['ryu'], 'りょ': ['ryo'],
    'ぎゃ': ['gya'], 'ぎゅ': ['gyu'], 'ぎょ': ['gyo'],
    'じゃ': ['ja', 'zya'], 'じゅ': ['ju', 'zyu'], 'じょ': ['jo', 'zyo'],
    'びゃ': ['bya'], 'びゅ': ['byu'], 'びょ': ['byo'],
    'ぴゃ': ['pya'], 'ぴゅ': ['pyu'], 'ぴょ': ['pyo'],
    'ー': ['-'],
    // 小さい「っ」の処理は複雑なため、今回は省略
};

// ひらがなをローマ字に変換する（デバッグや拡張用）
function hiraganaToRomaji(hira) {
    // 拗音（きゃ等）を先に処理
    const patterns = ['きゃ', 'きゅ', 'きょ', 'しゃ', 'しゅ', 'しょ', 'ちゃ', 'ちゅ', 'ちょ', 'にゃ', 'にゅ', 'にょ', 'ひゃ', 'ひゅ', 'ひょ', 'みゃ', 'みゅ', 'みょ', 'りゃ', 'りゅ', 'りょ', 'ぎゃ', 'ぎゅ', 'ぎょ', 'じゃ', 'じゅ', 'じょ', 'びゃ', 'びゅ', 'びょ', 'ぴゃ', 'ぴゅ', 'ぴょ'];
    for (const p of patterns) {
        if (hira.startsWith(p)) {
            return { romajiOptions: romajiMap[p], remainingHira: hira.substring(p.length) };
        }
    }
    // 通常の文字
    const char = hira[0];
    if (romajiMap[char]) {
        return { romajiOptions: romajiMap[char], remainingHira: hira.substring(1) };
    }
    return null; // 対応するローマ字がない
}

// --- p5.jsの関数 ---

// setup()の前に実行され、外部ファイルを読み込むために使います
function preload() {

    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTk-pjP-Z7GCV3aVLiIYCbYh5b1L4cmSBU0Bix7ZEgvsNy0m1qj6pGrGA4y9n8HChkFzvv45lja0Min/pub?output=csv';
    wordList = loadStrings(SPREADSHEET_URL);
}

// ゲームの初期設定
function setup() {
    // キャンバスを作成し、HTMLの'canvas-container'に配置
    const canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT);
    canvas.parent('canvas-container');

    // HTMLの入力ボックスを取得
    inputBox = select('#input-box');
    inputBox.elt.addEventListener('input', handleInput); // 'keydown'から'input'に変更

    // wordListが正しく読み込めたか確認し、空行を除外する
    if (!wordList || wordList.length === 0) {
        console.error("単語リストの読み込みに失敗したか、リストが空です。");
        // エラーメッセージを画面に表示してゲームを停止
        background(0, 0, 20);
        fill(255, 100, 100); // 赤っぽい色
        textAlign(CENTER, CENTER);
        textSize(16);
        text("エラー: 単語リストが読み込めません。\nスプレッドシートの公開URLが正しいか確認してください。", width / 2, height / 2);
        noLoop(); // draw()ループを停止
        return; // setup()をここで終了
    }
    // 読み込んだリストから空行を取り除く
    wordList = wordList.filter(word => word.trim() !== '');

    // フレームレート（1秒間の描画回数）を設定
    frameRate(60);
    
    // テキストのスタイル設定
    textSize(20);
    textAlign(CENTER, CENTER);
}

// 毎フレーム呼ばれる描画関数
function draw() {
    background(0, 0, 20); // 濃い紺色の背景（宇宙）

    if (gameState === GAME_STATE.PLAYING) {
        // プレイ中の処理
        handleMeteors();
        drawScore();
        
        // 50万点でクリア
        if (score >= GOAL_SCORE) {
            gameState = GAME_STATE.CLEARED;
        }
    } else if (gameState === GAME_STATE.CLEARED) {
        // ゲームクリア時の表示
        drawGameMessage('ゲームクリア！', '目的の星に到着した！');
    } else if (gameState === GAME_STATE.GAME_OVER) {
        // ゲームオーバー時の表示
        drawGameMessage('ゲームオーバー', '隕石が地球に衝突した...');
    }
}

// --- ゲームロジックの関数 ---

// 隕石の生成、移動、描画を管理
function handleMeteors() {
    // 一定の確率で新しい隕石を生成
    if (frameCount % 90 === 0) { // 1.5秒に1回くらい
        createMeteor();
    }

    // すべての隕石を処理
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        meteor.y += meteor.speed; // 隕石を下に移動
        
        // 隕石を描画
        fill(200, 200, 100); // 黄土色
        ellipse(meteor.x, meteor.y, 50, 50); // 円で隕石を表現
        fill(255); // 文字は白
        text(meteor.fullWord, meteor.x, meteor.y); // 全文を表示

        // 入力済みの部分を色を変えて表示
        fill(100, 255, 100); // 明るい緑
        const typedPart = meteor.fullWord.substring(0, meteor.fullWord.length - meteor.remainingWord.length);
        textAlign(CENTER, CENTER);
        text(typedPart, meteor.x, meteor.y);

        // 隕石が画面外に出たらゲームオーバー
        if (meteor.y > height) {
            gameState = GAME_STATE.GAME_OVER;
            break; // ループを抜ける
        }
    }
}

// 新しい隕石を作成する
function createMeteor() {
    // もし単語リストが空なら何もしない
    if (wordList.length === 0) return;

    const word = random(wordList); // 単語をランダムに選ぶ
    if (!word) return; // まれに取得できないケースに対応

    const x = random(50, width - 50); // 画面の左右に寄りすぎないように
    const speed = 0.5 + score / 50000; // スコアが上がると少し速くなる

    meteors.push({
        fullWord: word,      // 表示する単語全体（例: 'じしん'）
        remainingWord: word, // これからタイプするべき残りの単語（例: 'じしん'）
        typedRomaji: '',     // 現在入力途中のローマ字（例: 'j'）
        nextRomajiOptions: hiraganaToRomaji(word).romajiOptions, // 次に打つべきローマ字の選択肢（例: ['ji', 'zi']）

        x: x,
        y: -25, // 画面の上からスタート
        speed: speed
    });
}

// プレイヤーの入力を処理する
function handleInput(event) {
    const typedWord = inputBox.value();
    
    // 最も下にある隕石からチェック（一番狙いやすい隕石を優先）
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        const newTypedRomaji = meteor.typedRomaji + typedWord;

        let matched = false;
        for (const option of meteor.nextRomajiOptions) {
            if (option === newTypedRomaji) { // ローマ字が完全に一致
                const conversion = hiraganaToRomaji(meteor.remainingWord);
                meteor.remainingWord = conversion.remainingHira;
                meteor.typedRomaji = '';

                if (meteor.remainingWord.length === 0) { // 単語をすべて打ち終えた
                    score += meteor.fullWord.length * 1000;
                    meteors.splice(i, 1); // 隕石を消す
                } else { // 次の文字へ
                    meteor.nextRomajiOptions = hiraganaToRomaji(meteor.remainingWord).romajiOptions;
                }
                matched = true;
                break;
            } else if (option.startsWith(newTypedRomaji)) { // ローマ字の途中まで一致
                meteor.typedRomaji = newTypedRomaji;
                matched = true;
                break;
            }
        }

        if (matched) {
            // 一致する隕石が見つかったら、他の隕石はチェックしない
            inputBox.value(''); // 入力ボックスをクリア
            return;
        }
    }

    // どの隕石のどのパターンにも一致しなかった場合、入力をリセット
    inputBox.value('');
}

// スコアを画面に表示する
function drawScore() {
    fill(255);
    textAlign(LEFT, TOP);
    textSize(24);
    text(`スコア: ${score}`, 10, 10);
}

// ゲームクリア/オーバーのメッセージを表示する
function drawGameMessage(mainText, subText) {
    fill(0, 0, 0, 150); // 半透明の黒い四角
    rect(0, height / 2 - 50, width, 100);
    
    fill(255, 255, 0); // 黄色
    textSize(40);
    textAlign(CENTER, CENTER);
    text(mainText, width / 2, height / 2 - 10);
    
    fill(255); // 白
    textSize(20);
    text(subText, width / 2, height / 2 + 30);
}
