// --- ゲーム設定 ---
const GAME_WIDTH = 600;
const GAME_HEIGHT = 400;
const GOAL_SCORE = 250000;
// ★★★ ステップ1でコピーした、ご自身のGASウェブアプリのURLに置き換えてください ★★★
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwA1I_m9x_kinKLKLs_3Fao-YO2_DCA-Z1rN1TzblBkUP9qDxm-XNwJZ77mE_VckWzerQ/exec';


let wordLists = []; // 全レベルの単語リストを格納する配列
let meteors = []; // 隕石を管理する配列
let beams = []; // ビームを管理する配列
let explosions = []; // 爆発を管理する配列
let score = 0;
let stars = []; // 星空を管理する配列
let hiraGuideElement; // ひらがなガイドのHTML要素
let romajiGuideElement; // ローマ字ガイドのHTML要素
let rocketImage; // ロケットの画像を格納する変数
let clearImage; // クリア画像
let bombSound; // 爆発音
let clearSound; // クリア音
let beamSound; // ビーム音

// ゲームの状態を定数で管理する
const GAME_STATE = {
    USER_INFO_SELECT: 'userInfoSelect',
    DIFFICULTY_SELECT: 'difficultySelect',
    COUNTDOWN: 'countdown', // カウントダウン状態を追加
    PLAYING: 'playing',
    CLEARED: 'cleared',
    GAME_OVER: 'gameOver'
};
let gameState = GAME_STATE.USER_INFO_SELECT;
let currentLevel = 1; // 現在の難易度
let isEndlessMode = false; // エンドレスモードかどうか
let countdownTimer = 3; // カウントダウン用のタイマー
let comboCount = 0; // エンドレスモード用のコンボカウンター

// ユーザー情報を保持する変数
let userInfo = { grade: '', userClass: '', number: '' };


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
    'わ': ['wa'], 'を': ['wo'], 'ん': ['n'],
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
};

// ひらがなをローマ字に変換する（デバッグや拡張用）
function hiraganaToRomaji(hira) {
    if (!hira) return null;

    // 小さい「っ」の処理
    if (hira.startsWith('っ')) {
        const nextConversion = hiraganaToRomaji(hira.substring(1));
        if (nextConversion && nextConversion.romajiOptions.length > 0) {
            const firstConsonant = nextConversion.romajiOptions[0][0];
            return { romajiOptions: [firstConsonant], remainingHira: hira.substring(1) };
        }
    }

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

    const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTk-pjP-Z7GCV3aVLiIYCbYh5b1L4cmSBU0Bix7ZEgvsNy0m1qj6pGrGA4y9n8HChkFzvv45lja0Min/pub?output=csv'; // 必ずご自身のURLに置き換えてください
    loadStrings(SPREADSHEET_URL, parseWords);
    rocketImage = loadImage('rocket.png'); // ロケット画像を読み込む
    clearImage = loadImage('clear.png'); // クリア画像を読み込む
    bombSound = loadSound('bomb.wav'); // 爆発音を読み込む
    clearSound = loadSound('clear.mp3'); // クリア音を読み込む
    beamSound = loadSound('beam.wav'); // ビーム音を読み込む
}

// ゲームの初期設定
function setup() {
    // キャンバスを作成し、HTMLの'canvas-container'に配置
    const canvas = createCanvas(GAME_WIDTH, GAME_HEIGHT);
    canvas.parent('canvas-container');

    // HTMLのガイド要素を取得
    hiraGuideElement = select('#hira-guide');
    romajiGuideElement = select('#romaji-guide');

    // --- 画面の初期表示設定 ---
    select('#difficulty-screen').hide();
    select('#end-screen').hide();
    hiraGuideElement.hide();
    romajiGuideElement.hide();

    // --- ユーザー情報選択画面のセットアップ ---
    populateSelect('#grade-select', 0, 6, '学年');
    populateSelect('#class-select', 1, 4, '組');
    populateSelect('#number-select', 1, 40, '番');

    select('#confirm-user-info').mousePressed(() => {
        const gradeSelect = select('#grade-select');
        if (gradeSelect.value() === '0学年') {
            alert('学年をえらびましょう');
        } else {
            // ユーザー情報を保存
            userInfo.grade = select('#grade-select').value();
            userInfo.userClass = select('#class-select').value();
            userInfo.number = select('#number-select').value();

            select('#user-info-screen').hide();
            // ランキングを読み込んでから表示
            loadAndDisplayRankings();
            select('#difficulty-screen').show();
            gameState = GAME_STATE.DIFFICULTY_SELECT;
        }
    });

    // 難易度選択ボタンの処理
    const levelButtons = selectAll('.level-btn');
    levelButtons.forEach(button => {
        const btnId = button.id();
        if (btnId !== 'confirm-user-info' && btnId !== 'retry-btn' && btnId !== 'continue-btn') {
            button.mousePressed(() => {
                const level = parseInt(button.attribute('data-level'), 10);
                startGame(level);
            });
        }
    });

    // 「さらに続ける」ボタンの処理
    select('#continue-btn').mousePressed(continueGame);

    // リトライボタンの処理
    select('#retry-btn').mousePressed(resetGame);

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
    textFont('Press Start 2P', 'DotGothic16');
    textAlign(CENTER, CENTER);
}

// ゲームを開始する関数
function startGame(level) {
    currentLevel = level;
    select('#difficulty-screen').hide();
    countdownTimer = 3; // タイマーをリセット
    gameState = GAME_STATE.COUNTDOWN; // 状態をカウントダウンに
    loop(); // ゲーム再開時にループを再開
}

// ドロップダウンメニューを動的に生成する関数
function populateSelect(selector, start, end, label) {
    const sel = select(selector);
    sel.html(''); // オプションをクリア
    for (let i = start; i <= end; i++) {
        sel.option(`${i}${label}`);
    }
}

// エンドレスモードを続ける関数
function continueGame() {
    isEndlessMode = true;
    select('#end-screen').hide();
    countdownTimer = 3; // タイマーをリセット
    gameState = GAME_STATE.COUNTDOWN; // 状態をカウントダウンに
    loop(); // 停止していた描画ループを再開する
}

// ランキングを読み込んで表示する非同期関数
async function loadAndDisplayRankings() {
    // かんたん・むずかしいの両方のランキングを取得
    fetchRanking(1, '#ranking-list-easy', '#ranking-list-easy-grade', '#ranking-title-easy-grade');
    fetchRanking(2, '#ranking-list-hard', '#ranking-list-hard-grade', '#ranking-title-hard-grade');
}

// 指定されたレベルのランキングを取得してHTMLに表示する
async function fetchRanking(level, overallListSelector, gradeListSelector, gradeTitleSelector) {
    // p5.jsのselect()ではなく、標準のdocument.querySelectorを使用する
    const overallListElement = document.querySelector(overallListSelector);
    const gradeListElement = document.querySelector(gradeListSelector);
    const gradeTitleElement = document.querySelector(gradeTitleSelector);

    if (!overallListElement || !gradeListElement || !gradeTitleElement) return;

    overallListElement.innerHTML = '<li>読み込み中...</li>';
    gradeListElement.innerHTML = '<li>読み込み中...</li>';
    gradeTitleElement.innerHTML = `${userInfo.grade.replace('学年','')}学年内ランキング`;

    try {
        // ユーザー情報もクエリパラメータとして送信
        const grade = userInfo.grade.replace('学年', '');
        const userClass = userInfo.userClass.replace('組', '');
        const number = userInfo.number.replace('番', '');
        const url = `${GAS_URL}?level=${level}&grade=${grade}&userClass=${userClass}&number=${number}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const rankingData = await response.json();

        // GASから返ってきたデータが期待通りかチェック
        if (!rankingData || !rankingData.overall || !rankingData.grade) {
            throw new Error('Invalid ranking data received from server.');
        }

        // --- 全体ランキングの表示 ---
        displayRankingList(overallListElement, rankingData.overall, false);

        // --- 学年内ランキングの表示 ---
        displayRankingList(gradeListElement, rankingData.grade, true);

    } catch (error) {
        console.error('ランキングの取得に失敗しました:', error);
        overallListElement.innerHTML = '<li>読み込みに失敗しました</li>';
        gradeListElement.innerHTML = '<li>読み込みに失敗しました</li>';
    }
}

// ランキングリストを描画する補助関数
function displayRankingList(listElement, ranking, isGradeRanking) {
    const top5 = ranking.top5;
    const userRecord = ranking.userRecord;

    listElement.innerHTML = ''; // リストをクリア
    if (top5.length === 0) {
        listElement.innerHTML = '<li>まだ記録がありません</li>';
    } else {
        top5.forEach(player => {
            const rank = isGradeRanking ? player.gradeRank : player.rank;
            // 現在のプレイヤーが自分自身かどうかを判定
            const isCurrentUser = userRecord && (isGradeRanking ? player.gradeRank === userRecord.gradeRank : player.rank === userRecord.rank);
            if (isCurrentUser) {
                // 自分の記録なら黄色で表示
                listElement.innerHTML += `<li style="color: #ffff00;">${rank}位: ${player.grade}年${player.userClass}組${player.number}番 - ${player.score}点</li>`;
            } else {
                listElement.innerHTML += `<li>${rank}位: ${player.grade}年${player.userClass}組${player.number}番 - ${player.score}点</li>`;
            }
        });

        // 自分の記録がトップ5に入っていない、かつ記録が存在する場合
        const isUserInTop5 = userRecord && top5.some(p => (isGradeRanking ? p.gradeRank === userRecord.gradeRank : p.rank === userRecord.rank));
        if (userRecord && !isUserInTop5) {
            const rank = isGradeRanking ? userRecord.gradeRank : userRecord.rank;
            listElement.innerHTML += `<li style="color: #ffff00;">...</li>`; // 区切り
            listElement.innerHTML += `<li style="color: #ffff00;">${rank}位: あなたの記録 - ${userRecord.score}点</li>`;
        } else {
            // 自分の記録がトップ5に入っているが、リストに表示されていない場合（6位以降だが記録はある場合など）
            // このケースは現状のロジックでは発生しにくいが、念のため
        }
    }
}

// 毎フレーム呼ばれる描画関数
function draw() {
    background(0, 0, 20); // 濃い紺色の背景（宇宙）

    drawStars(); // 星を描画

    // ロケットを描画
    if (rocketImage) {
        const rocketWidth = 60;
        const rocketHeight = rocketWidth * (rocketImage.height / rocketImage.width);
        const rocketX = width / 2 - rocketWidth / 2;
        const rocketY = height - rocketHeight;
        image(rocketImage, rocketX, rocketY, rocketWidth, rocketHeight);
    }

    // カウントダウン中の処理
    if (gameState === GAME_STATE.COUNTDOWN) {
        // カウントダウンの数字を描画
        fill(255, 255, 0);
        textSize(80);
        textAlign(CENTER, CENTER);
        text(ceil(countdownTimer), width / 2, height / 2);

        countdownTimer -= deltaTime / 1000; // 経過時間でタイマーを減らす

        if (countdownTimer <= 0) {
            gameState = GAME_STATE.PLAYING; // ゲームプレイ状態へ
            hiraGuideElement.show(); // ガイドを表示
            romajiGuideElement.show();
        }
        return; // カウントダウン中は以下の処理を行わない
    }

    // プレイ中以外はゲームロジックを実行しない
    if (gameState !== GAME_STATE.PLAYING) {
        return;
    }

    // プレイ中の処理
    handleBeams();
    handleExplosions();
    handleMeteors();
    updateTypingGuide(); // ガイド表示を更新する
    drawScore();
    
    // クリア判定
    if (score >= GOAL_SCORE && !isEndlessMode) {
        sendScore(score); // クリア時にスコアを送信
        clearSound.play(); // クリア音を再生
        gameState = GAME_STATE.CLEARED;
        showEndScreen('ゲームクリア！', '目的の星に到着した！', true, clearImage);
    }
}

// スプレッドシートから読み込んだデータを解析する関数
function parseWords(data) {
    wordLists = []; // 初期化
    for (const line of data) {
        const words = line.split(',');
        for (let i = 0; i < words.length; i++) {
            if (!wordLists[i]) {
                wordLists[i] = [];
            }
            const word = words[i].trim();
            if (word) {
                wordLists[i].push(word);
            }
        }
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
    // 画面上にターゲットにされていない隕石がなければ、新しい隕石を1つ生成する
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
            sendScore(score); // ゲームオーバー時にスコアを送信
            showEndScreen('ゲームオーバー', '隕石が地球に衝突した...', false);
            gameState = GAME_STATE.GAME_OVER;
            break; // ループを抜ける
        }
    }
}

// 新しい隕石を作成する
function createMeteor() {
    const targetWordList = wordLists[currentLevel - 1] || [];

    // もし単語リストが空なら何もしない
    if (targetWordList.length === 0) return;

    const word = random(targetWordList); // 選択されたレベルのリストから単語をランダムに選ぶ
    if (!word) return; // まれに取得できないケースに対応

    const x = random(50, width - 50); // 画面の左右に寄りすぎないように
    const speed = 0.2 + score / 150000; // 隕石の速度をさらに遅く調整

    meteors.push({
        fullWord: word,      // 表示する単語全体（例: 'じしん'）
        remainingWord: word, // これからタイプするべき残りの単語（例: 'じしん'）
        typedRomaji: '',     // 現在入力途中のローマ字（例: 'j'）
        // hiraganaToRomajiがnullを返す可能性に対処
        guideRomaji: buildGuideRomaji(word), // ★ ガイド用のローマ字を生成
        isTargeted: false, // ビームのターゲットになっているか
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
    // プレイ中以外は何もしない
    if (gameState !== GAME_STATE.PLAYING) {
        return;
    }

    // ゲームプレイ中以外、またはSHIFTキーなどの特殊キーの場合は何もしない
    if (key.length > 1) {
        return;
    }

    // 押されたキーは小文字として扱う
    const typedChar = key.toLowerCase();

    // 画面上のすべての隕石をチェック
    for (let i = meteors.length - 1; i >= 0; i--) {
        const meteor = meteors[i];
        // 既にターゲットになっている隕石は無視
        if (meteor.isTargeted) continue;

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
                    createBeam(meteor); // 隕石を直接消さずにビームを生成
                    meteor.isTargeted = true; // この隕石はもうターゲットにしない
                } else { // 次のひらがなへ進む
                    const nextConversion = hiraganaToRomaji(meteor.remainingWord);
                    if (nextConversion) {
                        meteor.nextRomajiOptions = nextConversion.romajiOptions;
                    } else {
                        meteor.nextRomajiOptions = [];
                    }
                }
                anyMatch = true;
                return; // 一致したら他の隕石はチェックしない
            } else if (option.startsWith(newTypedRomaji)) { // ローマ字の途中まで一致した場合
                meteor.typedRomaji = newTypedRomaji;
                partialMatch = true;
                anyMatch = true;
                return; // 途中一致でも他の隕石はチェックしない
            }
        }
    }

    // どの隕石のどの候補とも一致しなかった場合（タイプミス）
    // 入力途中の文字がある一番手前の隕石の入力をリセット
    const firstMeteor = meteors.find(m => !m.isTargeted);
    if (firstMeteor && firstMeteor.typedRomaji !== '') {
        firstMeteor.typedRomaji = '';
    }
}

// ビームを生成する関数
function createBeam(targetMeteor) {
    beamSound.play(); // ビーム音を再生
    const rocketX = width / 2;
    const rocketY = height - 60; // ロケット画像の上端あたり

    beams.push({
        x: rocketX,
        y: rocketY,
        target: targetMeteor,
        speed: 25
    });
}

// ビームの移動と衝突判定を管理する関数
function handleBeams() {
    for (let i = beams.length - 1; i >= 0; i--) {
        const beam = beams[i];
        const target = beam.target;

        // ターゲットに向かって移動
        const angle = atan2(target.y - beam.y, target.x - beam.x);
        beam.x += cos(angle) * beam.speed;
        beam.y += sin(angle) * beam.speed;

        // ビームを描画
        stroke(0, 255, 255); // シアン
        strokeWeight(4);
        line(beam.x, beam.y, beam.x - cos(angle) * 10, beam.y - sin(angle) * 10);

        // 衝突判定
        if (dist(beam.x, beam.y, target.x, target.y) < 25) {
            bombSound.play(); // 爆発音を再生
            createExplosion(target.x, target.y);
            
            let earnedScore = 0;
            if (isEndlessMode) {
                // エンドレスモード：コンボ数に応じてスコアが減少
                comboCount++;
                // 10000点をベースに、コンボ数が増えるほど減衰させる
                earnedScore = Math.max(1000, 10000 - (comboCount * 200));
            } else {
                // 通常モード：単語の長さに応じてスコアを加算
                earnedScore = 15000 + target.fullWord.length * 4000;
            }
            score += earnedScore;


            // 隕石を削除
            const meteorIndex = meteors.indexOf(target);
            if (meteorIndex > -1) {
                meteors.splice(meteorIndex, 1);
            }

            beams.splice(i, 1); // ビームを削除
        }
    }
}

// 爆発を生成する関数
function createExplosion(x, y) {
    explosions.push({
        x: x,
        y: y,
        life: 30, // 爆発の持続時間（フレーム数）
        maxLife: 30,
    });
}

// 爆発の描画とライフサイクルを管理する関数
function handleExplosions() {
    noStroke();
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        const progress = exp.life / exp.maxLife; // 0 (終了) -> 1 (開始)
        const alpha = 255 * progress;
        const currentSize = (exp.maxLife - exp.life) * 2;

        fill(255, 255, 0, alpha); // 黄色
        ellipse(exp.x, exp.y, currentSize);

        exp.life--;
        if (exp.life <= 0) {
            explosions.splice(i, 1);
        }
    }
}

// 画面下部にタイピングガイドを表示する関数
function updateTypingGuide() {
    // ターゲットにされていない一番手前の隕石を探す
    const currentMeteor = meteors.find(m => !m.isTargeted);

    if (!currentMeteor) {
        // 隕石がないときはガイドを空にする
        hiraGuideElement.html('');
        romajiGuideElement.html('');
        return;
    }

    const meteor = currentMeteor;

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
function showEndScreen(mainText, subText, showContinue, endImage = null) {
    // ガイドを非表示にする
    hiraGuideElement.hide();
    romajiGuideElement.hide();

    // 終了画像があれば描画
    if (endImage) {
        image(endImage, 0, 0, width, height); // キャンバス全体に表示
    }

    // メッセージとボタンを表示
    select('#end-main-text').html(mainText);
    select('#end-sub-text').html(subText);

    if (showContinue) {
        select('#continue-btn').show();
    } else {
        select('#continue-btn').hide();
    }
    select('#retry-btn').show();

    select('#end-screen').style('display', 'flex');
    noLoop(); // ゲームの描画ループを停止
}

// ゲームをリセットする関数
function resetGame() {
    score = 0;
    meteors = [];
    beams = [];
    explosions = [];
    isEndlessMode = false; // エンドレスモードをリセット
    comboCount = 0; // コンボカウントをリセット
    gameState = GAME_STATE.DIFFICULTY_SELECT; // ゲームの状態を難易度選択に戻す
    // ランキングを更新してから表示
    loadAndDisplayRankings();
    select('#end-screen').hide(); // 終了画面を非表示
    select('#difficulty-screen').show(); // 難易度選択画面を再表示
    loop(); // ゲームをリセットし、画面遷移が完了したこのタイミングで描画ループを再開する
}

// スコアをGASに送信する非同期関数
async function sendScore(currentScore) {
    // URLが設定されていない、またはスコアが0以下の場合は何もしない
    if (!GAS_URL || GAS_URL === 'ここにGASのウェブアプリURLを貼り付け' || currentScore <= 0) {
        console.log('スコア送信をスキップしました (URL未設定またはスコアが0)');
        return;
    }

    const data = {
        grade: userInfo.grade.replace('学年', ''),
        userClass: userInfo.userClass.replace('組', ''),
        number: userInfo.number.replace('番', ''),
        score: currentScore,
        level: currentLevel // 難易度情報を追加
    };

    try {
        await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors', // CORSエラーを回避するため
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log('スコア送信成功:', data);
    } catch (error) {
        console.error('スコア送信エラー:', error);
    }
}


