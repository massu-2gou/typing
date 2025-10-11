// --- ゲーム設定 ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const GOAL_SCORE = 500000;

let wordList; // 外部ファイルから読み込んだ単語リストを格納する変数
let meteors = []; // 隕石を管理する配列
let score = 0;
let stars = []; // 星空を管理する配列
let hiraGuideElement; // ひらがなガイドのHTML要素
let romajiGuideElement; // ローマ字ガイドのHTML要素

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

    // HTMLのガイド要素を取得
    hiraGuideElement = select('#hira-guide');
    romajiGuideElement = select('#romaji-guide');

    // wordListが正しく読み込めたか確認し、空行を除外する
    if (!wordList) { // preloadが失敗した場合のフォールバック
        wordList = [];
    }
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

    // 星を初期化
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: random(width),
            y: random(height),
            size: random(1, 3),
            speed: random(0.5, 2)
        });
    }

    // フレームレート（1秒間の描画回数）を設定
    frameRate(60);
    
    // テキストのスタイル設定
    textFont('Press Start 2P');
    textAlign(CENTER, CENTER);
}

// 毎フレーム呼ばれる描画関数
function draw() {
    background(0, 0, 20); // 濃い紺色の背景（宇宙）

    drawStars(); // 星を描画
    if (gameState === GAME_STATE.PLAYING) {
        // プレイ中の処理
        handleMeteors();
        updateTypingGuide(); // ガイド表示を更新する
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

// 星空を描画する関数
function drawStars() {
    fill(255);
    noStroke();
    for (const star of stars) {
        ellipse(star.x, star.y, star.size);
        star.y += star.speed;
        if (star.y > height) {
            star.y = 0;
            star.x = random(width);
        }
    }
}
// 隕石の生成、移動、描画を管理
function handleMeteors() {
    // 画面上に隕石がなければ、新しい隕石を1つ生成する
    if (meteors.length === 0) {
        createMeteor();
    }

    // すべての隕石を処理
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        meteor.y += meteor.speed; // 隕石を下に移動
        
        // 隕石を描画
        fill(200, 200, 100); // 黄土色
        ellipse(meteor.x, meteor.y, 50, 50); // 円で隕石を表現
        textSize(18);
        textAlign(CENTER, CENTER); // ★★★ 文字を描画する前に中央揃えに設定
        fill(255); // 文字は白
        text(meteor.fullWord, meteor.x, meteor.y); // 全文を表示

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
        // hiraganaToRomajiがnullを返す可能性に対処
        guideRomaji: buildGuideRomaji(word), // ★ ガイド用のローマ字を生成
        nextRomajiOptions: (hiraganaToRomaji(word) || { romajiOptions: [] }).romajiOptions,

        x: x,
        y: -25, // 画面の上からスタート
        speed: speed
    });
}

// ガイド用のローマ字文字列を生成する関数
function buildGuideRomaji(hira) {
    let result = '';
    let remaining = hira;
    while (remaining.length > 0) {
        const conversion = hiraganaToRomaji(remaining);
        if (conversion && conversion.romajiOptions.length > 0) {
            result += conversion.romajiOptions[0]; // 最初の候補をデフォルトとして使う
            remaining = conversion.remainingHira;
        } else {
            break; // 変換できない文字があったら終了
        }
    }
    return result;
}

// キーが押されたときにp5.jsによって自動的に呼ばれる関数
function keyPressed() {
    // ゲームプレイ中以外、またはSHIFTキーなどの特殊キーの場合は何もしない
    if (gameState !== GAME_STATE.PLAYING || key.length > 1) {
        return;
    }

    // 押されたキーは小文字として扱う
    const typedChar = key.toLowerCase();

    let anyMatch = false;

    // 画面上のすべての隕石をチェック
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        const newTypedRomaji = meteor.typedRomaji + typedChar;

        let partialMatch = false;
        for (const option of meteor.nextRomajiOptions) {
            if (option === newTypedRomaji) { // ローマ字が完全に一致した場合
                const conversion = hiraganaToRomaji(meteor.remainingWord);
                // ユーザーがデフォルト以外の表記を使った場合、ガイドを更新する
                if (option !== conversion.romajiOptions[0]) {
                    const typedLength = meteor.fullWord.length - meteor.remainingWord.length;
                    const typedHira = meteor.fullWord.substring(0, typedLength);
                    meteor.guideRomaji = buildGuideRomaji(typedHira) + option + buildGuideRomaji(conversion.remainingHira);
                }
                meteor.remainingWord = conversion.remainingHira;
                meteor.typedRomaji = '';

                if (meteor.remainingWord.length === 0) { // 単語をすべて打ち終えた場合
                    score += meteor.fullWord.length * 1000;
                    meteors.splice(i, 1); // 隕石を消す
                } else { // 次のひらがなへ進む
                    const nextConversion = hiraganaToRomaji(meteor.remainingWord);
                    if (nextConversion) {
                        meteor.nextRomajiOptions = nextConversion.romajiOptions;
                    } else {
                        meteor.nextRomajiOptions = [];
                    }
                }
                anyMatch = true;
                break;
            } else if (option.startsWith(newTypedRomaji)) { // ローマ字の途中まで一致した場合
                meteor.typedRomaji = newTypedRomaji;
                partialMatch = true;
                anyMatch = true;
                break;
            }
        }
        if (partialMatch) {
            // 途中まで一致する隕石があったら、他の隕石はもうチェックしない
            // （例：「s」と打った時に「sushi」と「sakana」の両方が反応しないように）
            break;
        }
    }

    // どの隕石とも全く一致しなかった場合（タイプミス）、すべての隕石の入力をリセット
    if (!anyMatch) {
        for (const meteor of meteors) {
            meteor.typedRomaji = '';
        }
    }
}

// 画面下部にタイピングガイドを表示する関数
function updateTypingGuide() {
    if (meteors.length === 0) {
        // 隕石がないときはガイドを空にする
        hiraGuideElement.html('');
        romajiGuideElement.html('');
        return;
    }

    const meteor = meteors[0]; // 現在の隕石

    // --- 1. お題（ひらがな）のガイドを描画 ---
    const fullHira = meteor.fullWord;
    const remainingHira = meteor.remainingWord;
    const typedHira = fullHira.substring(0, fullHira.length - remainingHira.length);
    const hiraHTML = `<span class="typed">${typedHira}</span><span class="untyped">${remainingHira}</span>`;
    hiraGuideElement.html(hiraHTML);

    // --- 2. ローマ字ガイドの描画 ---
    const fullGuide = meteor.guideRomaji;
    const remainingGuide = buildGuideRomaji(meteor.remainingWord);
    const typedGuide = buildGuideRomaji(typedHira);
    const romajiHTML = `<span class="typed">${typedGuide}</span><span class="untyped">${remainingGuide}</span>`;
    romajiGuideElement.html(romajiHTML);
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
