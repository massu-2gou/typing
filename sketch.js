// --- ゲーム設定 ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const GOAL_SCORE = 500000;

let wordList; // 外部ファイルから読み込んだ単語リストを格納する変数
let meteors = []; // 隕石を管理する配列
let score = 0;
let inputBox;
let gameState = 'playing'; // 'playing', 'cleared', 'gameOver'

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
    inputBox.elt.addEventListener('keydown', handleInput);

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

    if (gameState === 'playing') {
        // プレイ中の処理
        handleMeteors();
        drawScore();
        
        // 50万点でクリア
        if (score >= GOAL_SCORE) {
            gameState = 'cleared';
        }
    } else if (gameState === 'cleared') {
        // ゲームクリア時の表示
        drawGameMessage('ゲームクリア！', '目的の星に到着した！');
    } else if (gameState === 'gameOver') {
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
        text(meteor.word, meteor.x, meteor.y);

        // 隕石が画面外に出たらゲームオーバー
        if (meteor.y > height) {
            gameState = 'gameOver';
            break; // ループを抜ける
        }
    }
}

// 新しい隕石を作成する
function createMeteor() {
    const word = random(wordList); // 読み込んだ単語リストからランダムに選ぶ
    const x = random(50, width - 50); // 画面の左右に寄りすぎないように
    const speed = 0.5 + score / 50000; // スコアが上がると少し速くなる

    meteors.push({
        word: word,
        x: x,
        y: -25, // 画面の上からスタート
        speed: speed
    });
}

// プレイヤーの入力を処理する
function handleInput(event) {
    if (event.key === 'Enter') {
        const typedWord = inputBox.value();
        
        // 画面内の隕石と一致するかチェック
        for (let i = meteors.length - 1; i >= 0; i--) {
            if (meteors[i].word === typedWord) {
                // 一致したらスコアを加算して隕石を消す
                score += meteors[i].word.length * 1000; // 文字数に応じてスコアUP
                meteors.splice(i, 1); // 配列から隕石を削除
                
                // TODO: ビーム発射エフェクトを追加すると良い
                break; // 複数の同じ単語があっても1つだけ消す
            }
        }
        
        inputBox.value(''); // 入力ボックスを空にする
        event.preventDefault(); // フォームのデフォルト送信を防ぐ
    }
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



