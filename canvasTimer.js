/*eslint-env browser */
/*globals event */

// BlockDrawクラス ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
var BlockDraw = function(x, y, context) {
//x      :canvas上のフィールドx座標(基準座標)
//y      :canvas上のフィールドy座標(基準座標)
//context:canvasの2Dコンテキスト

	this.fX = x; 				// フィールドのキャンパス上のx座標
	this.fY = y; 				// フィールドのキャンパス上のy座標
	this.tContext = context;	// 描画用コンテキスト
	this.BLK_SIZE = 20;			// 単位ブロックのサイズ(ドット)
	this.bColor = [11];			// 各ブロックのカラー

	this.bColor[ 0] = ["#ffffff","#ffffff","#ffffff"]; // 無:透明 (便宜上定義。未使用)
	this.bColor[ 1] = ["#888800","#ffff00","#ffff88"]; // ブロック1:黄
	this.bColor[ 2] = ["#008888","#00ffff","#88ffff"]; // ブロック2:水
	this.bColor[ 3] = ["#880088","#ff00ff","#ff88ff"]; // ブロック3:紫
	this.bColor[ 4] = ["#000088","#0000ff","#8888ff"]; // ブロック4:青
	this.bColor[ 5] = ["#008800","#00ff00","#88ff88"]; // ブロック5:緑
	this.bColor[ 6] = ["#888888","#dddddd","#ffffff"]; // ブロック6:白
	this.bColor[ 7] = ["#880000","#ff0000","#ff8888"]; // ブロック7:赤
	this.bColor[ 8] = ["#000000","#222222","#444444"]; // 背景:黒
	this.bColor[ 9] = ["#666666","#aaaaaa","#ffffff"]; // 壁:銀
	this.bColor[10] = ["#aaaaaa","#cccccc","#eeeeee"]; // 消える時の点滅:白
};

BlockDraw.prototype.Draw = function (bpattern, scr) {
// bpattern:ブロックパターンの2次元配列
// scr     :スコア(文字列)

	this.tContext.beginPath();

	// ブロック描画
	for (var i=0; i<bpattern.length; i++)
		for (var j=0; j<bpattern[i].length; j++)
			if (bpattern[i][j] !== 0) {
				this.tContext.fillStyle = this.bColor[bpattern[i][j]][0];
				this.tContext.strokeStyle = this.bColor[bpattern[i][j]][1];
				this.tContext.lineWidth = 3	;
				this.tContext.fillRect(this.fX+i*this.BLK_SIZE, this.fY+this.BLK_SIZE*j, this.BLK_SIZE-1, this.BLK_SIZE-1);
				this.tContext.strokeRect(this.fX+i*this.BLK_SIZE, this.fY+this.BLK_SIZE*j, this.BLK_SIZE-1, this.BLK_SIZE-1);
			}

	// スコアを描画する。
	this.tContext.font = "bold 26pt 'arial'";
	this.tContext.fillStyle = "#ffffff";
	this.tContext.fillText(scr, this.fX+this.BLK_SIZE*8, this.fY+this.BLK_SIZE*2);

	this.tContext.stroke();
};
// BlockDrawクラス △△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△

// Blockクラス ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
var Block = function (type, pattern) {
// type   :ブロックタイプ (現状未使用) 
// pattern:4×4の2次元配列

	this.Type = type;	// ブロックタイプ

	// ブロック形状 [向き][x座標][y座標] の配列を定義する。(JacaScript不便だな！他に良い方法があるに違いない…)
	this.BlockPattern = [3];
	for (var d=0; d<4; d++) {
		this.BlockPattern[d] = [3];
		for (var e=0; e<4; e++) {
			this.BlockPattern[d][e] = [3];
		}
	}

	// 各ブロックの回転データを作成する。
	this.BlockPattern[0] = pattern;
	for (var i=0; i<3; i++) {
		for (var j=0; j<4; j++) {
			for (var k=0; k<4; k++) {
				this.BlockPattern[i+1][k][j] = this.BlockPattern[i][3-j][k];
			}
		}
	}
};

Block.prototype.getPattern = function (direction) {
// direction：ブロックの向き

	return this.BlockPattern[direction];
};
// Blockクラス △△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△

// Fieldクラス ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
var Field = function (blockdraw) {
//blockdraw:BlockDrawオブジェクト

	this.Block_Obj = [6];	// Blockオブジェクト全7種類
	this.tBlock;			// 落下中のブロックのタイプ(0～6)
	this.tBlock_dir;		// 落下中のブロックの向き(0～3)
	this.tBlock_posX;		// 落下中のブロックx座標
	this.tBlock_posY;		// 落下中のブロックy座標
	this.nBlock;			// 次のブロックのタイプ(0～6)
	this.nBlock_dir;		// 次のブロックの向き(0～3)
	this.Field;				// フィールド配列(12×25)：ゲームフィールドは10×20。枠とネクストブロック表示エリア分を追加
	this.FieldB;			// フィールド配列：描画用バッファ
	this.Line;				// 消したライン数
	this.ers = [4];			// 消したラインのField上のy座標
	this.gStatus;			// ゲーム状態(0:落下中、1:ライン消滅中、2:ゲームオーバー中)
	this.gStatusCount = [3];// ゲーム状態それぞれでのカウンタ。それぞれの最大値いくつになるかなぁ…■■■順次検討
							// 0(落下中):カウントが0になったら落下させてカウント値復帰。点数に応じてカウント値が小さくなる。
							// 1(ライン消滅中):ライン消してる時のアニメやりたい。
							// 2(ゲームオーバー中):ゲームオーバー画面を一定時間表示させたい。
							// しかしなんだろう、このグダグダな定義は。Haskellならカッチリ出来そうんだが…うまい方法なないものか…。
	this.gStatusCount0 = 30;// ゲーム状態0カウント初期値用変数
	this.gStatusCountL;		// ゲーム状態0カウント(ゲーム中スコアに応じたカウント)
	this.gStatusCount2;		// ゲーム状態2カウント初期値用変数
	this.score;				// スコア
	this.BlockDraw_Obj = blockdraw;
							//BlockDrawオブジェクト

	// Blockオブジェクトの定義
	this.Block_Obj[0] = new Block(0, [[0,0,0,0], [0,1,1,0], [0,1,1,0], [0,0,0,0]]);
	this.Block_Obj[1] = new Block(1, [[0,0,0,0], [0,2,0,0], [2,2,2,0], [0,0,0,0]]);
	this.Block_Obj[2] = new Block(2, [[0,3,0,0], [0,3,0,0], [0,3,3,0], [0,0,0,0]]);
	this.Block_Obj[3] = new Block(3, [[0,0,4,0], [0,0,4,0], [0,4,4,0], [0,0,0,0]]);
	this.Block_Obj[4] = new Block(4, [[0,0,0,0], [0,0,5,0], [0,5,5,0], [0,5,0,0]]);
	this.Block_Obj[5] = new Block(5, [[0,0,0,0], [0,6,0,0], [0,6,6,0], [0,0,6,0]]);
	this.Block_Obj[6] = new Block(6, [[0,0,7,0], [0,0,7,0], [0,0,7,0], [0,0,7,0]]);
};

Field.prototype.newGame = function () {
	this.tBlock = Math.floor(Math.random()*7);		// 最初のブロック(0～6)
	this.tBlock_dir =  Math.floor(Math.random()*3);	// 最初のブロックの向き(0～3)
	this.tBlock_posX = 4;							// 最初のブロックx座標
	this.tBlock_posY = 0;							// 最初のブロックy座標
	this.nBlock = Math.floor(Math.random()*7);		// 次のブロック(0～6)
	this.nBlock_dir = Math.floor(Math.random()*3);	// 次のブロックの向き(0～3)
	this.gStatus = 0;								// ゲーム状態を落下中に設定
	this.gStatusCount = [60, 10, 20];				// 各ゲーム状態のカウント値を設定 ■■■順次検討
	this.gStatusCountL = this.gStatusCount0;		// ゲーム状態0の初期カウント ■■■暫定
	this.gStatusCount2 = 30;						// ゲーム状態2の初期カウント ■■■暫定
	this.score = 0;									// スコア初期化
	this.Field =									// フィールド配列
		[[9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9],
		 [9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [9,9,9,9,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9],
		 [9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9,9]];
	this.FieldB = [12];								// フィールド配列描画用バッファにフィールド配列をコピーする
	for (var i=0; i<12; i++) {						// (注意)フィールド配列よりy座標側が1列少ない
		this.FieldB[i] = [25];
		for (var j=0; j<25; j++)
			this.FieldB[i][j] = this.Field[i][j];
	}

	this.buffDraw();	// 現ブロックをバッファに描きこみ表示
};

Field.prototype.MoveDec = function (para, rot, fa) {
// para:平行移動(-1、0、1)
// rot:ブロックの向き(0～3)
// fa:落下有無(0:無、1:有)

	// 移動or回転or落下先のフィールドの状態を参照し、各動作が可能か否か判定する。
	var judge = 0;
	for (var i=0; i<4; i++)
		for (var j=0; j<4; j++)
			if ((this.Block_Obj[this.tBlock].getPattern(rot)[i][j] !== 0 ) &&
				(this.Field[this.tBlock_posX + i + para][this.tBlock_posY + j + fa] !== 8))
				judge++;

	// 結果を返す(0:可能、1以上:不可能)
	return judge;
};

Field.prototype.period = function (input) {
// input:入力操作

	var ret = -2;	// 結果応答格納用変数を初期化

	// ゲーム状態に応じた処理を実行する。
	switch (this.gStatus) {
		case 0:	// 0:落下中
			// 渡されたイベント行列を先頭から順に読み込み、それぞれの動作を実行する。
			// 今のところ、「FA」は入力順に関わらずイベント行列の必ず最後に設定される予定(粘れるように)。
			this.gStatusCount[this.gStatus]--;	// 落下中状態のカウントを-1する。
			var x = 0;
			while (input[x] !== null) {
				switch (input[x].toString()) {
					case "RW":
					case "LW":
						var co;
						if (input[x].toString() === "RW") co = 1;
						else if (input[x].toString() === "LW") co = -1;
						else break; // いらんとは思うけど一応。

						// ブロックの全単位ブロックのx座標の移動方向のフィールド位置にブロックがあるか確認する。
						var judge = this.MoveDec(co, this.tBlock_dir, 0);

						// ブロック移動可否判定
						if (judge === 0) {
							// 移動可能の場合、移動させる。
							this.tBlock_posX = this.tBlock_posX + co;	// 移動先のフィールド座標に何もなければ、x座標を変更する。
						}
						break;					
					case "RT":
						// ブロックの向きを90°左に回す。
						var ro = this.tBlock_dir + 1;
						if (ro === 4) ro = 0;

						// ブロックの全単位ブロックの回転後のフィールド位置にブロックがあるか確認する。
						judge = this.MoveDec(0, ro, 0);

						// ブロック回転可否判定
						if (judge === 0) {
							// 回転可能の場合、回転させる。
							this.tBlock_dir = ro;	// 回転後のフィールド座標に何もなければ、ブロックの向きを変更する。
						}
						break;
					case "DW":
						// 落下カウンターを0にする。
						this.gStatusCount[this.gStatus] = 0;
						break;
					case "FA":
						if (this.gStatusCount[this.gStatus] <= 0) {
							// ブロックの全単位ブロックのY座標+1のフィールド位置にブロックがあるか確認する。
							judge = this.MoveDec(0, this.tBlock_dir, 1);

							// ブロック着地判定
							if (judge === 0) {
								// 着地しない場合、落下させる。
								this.tBlock_posY++;	// 落下先のフィールド座標に何もなければ、y座標を+1する。
								this.gStatusCount[this.gStatus] = this.gStatusCountL; // 現在のカウントを設定する。
							} else {
								// 現在の位置にブロックを固定、左上に次のブロックを固定する(フィールドにブロックを書き込む)。
								this.FieldAddBlock(this.Field);

								// ゲームオーバー判定
								if (this.tBlock_posY === 0) {
									// ゲーム状態を「2:ゲームオーバー中」にする。
									this.gStatus = 2;
									this.gStatusCount[this.gStatus] = this.gStatusCount2;
								} else {
									// ブロック消滅判定
									var c;			// ライン全てにブロックがあるかどうか判定用
									this.Line = 0;	// 消したライン数
									// ラインが消えたか判定し、消えた場合はそのy座標を保存する。
									for (var i=0; i<4; i++) {
										c=0;
										for (var j=1; j<11; j++)
											if ((this.Field[j][this.tBlock_posY+i] !== 8) && (this.Field[j][this.tBlock_posY+i] !== 9)) c++;
										if (c >= 10) {
											this.ers[this.Line] = this.tBlock_posY+i;	
											this.Line++;	
										}
									}
									// ラインが消えている場合、状態を「1:ライン消滅中」に変更。
									if (this.Line > 0) {
										this.gStatus = 1; 
										this.gStatusCount[this.gStatus] = 10; // ■■■ 暫定
									}
									
									// 次のブロックを用意する
									this.tBlock = this.nBlock;			// 次のブロックを最初のブロックに代入
									this.tBlock_dir =  this.nBlock_dir;	// 次のブロックをの向きを最初のブロックの向きに代入
									this.tBlock_posX = 4;				// 最初のブロックx座標
									this.tBlock_posY = 0;				// 最初のブロックy座標
									this.nBlock = Math.floor(Math.random()*7);		// 次のブロック(0～6)
									this.nBlock_dir = Math.floor(Math.random()*3);	// 次のブロックの向き(0～3)
								}
								ret = -1;	// 結果応答に「-1:接地」を設定。
							}
						}
						break;
				}
				x++;
			}
			this.buffDraw();	// 現ブロックをバッファに描きこみ表示。
			break;
		case 1:	// 2:ライン消滅中
			// 消えてるラインをFieldから消去する。
			// ■■■ この状態、全体的に、とりあえず最低ゲームできるようにアニメーション等一切無しでテキトーに作った。
			for (i=0; i<this.Line; i++) {
				for (j=this.ers[i]; j>=4; j--)
					for (var k=1; k<11; k++)
						this.Field[k][j] = this.Field[k][j-1];
				for (k=1; k<11; k++)
					this.Field[k][4] = 8;
			}

			// スコアに消滅ライン数の2乗を追加。
			this.score = this.score + this.Line * this.Line;

			this.buffDraw();
			
			// ゲーム状態を「0:落下中」に変更。
			this.gStatus = 0;
			// 落下カウントをスコアに応じて設定する。100点毎に10%ずつ早くなっていき、1000点がマックススピード。
			var fcx = this.score / 30;
			if (20 < fcx) fcx = 20;
			this.gStatusCountL = Math.floor(this.gStatusCount0 * Math.pow(0.9, fcx));
			this.gStatusCount[this.gStatus] = this.gStatusCountL;

			break;
		case 2:	// 3:ゲームオーバー中
			// ■■■ 未実装

			// 結果応答に「0～:ゲームオーバー(数値は点数)」を設定。
			ret = 99;	// ■■■ 暫定
			break;
	}

	return ret;	// 結果を応答する。
};

Field.prototype.FieldAddBlock = function(field) {
// field:フィールドオブジェクト

	// 渡されたフィールドオブジェクトの現在の位置にブロックを固定する(フィールドにブロックを書き込む)。
	var x;
	for (var p=0; p<4; p++)
		for (var q=0; q<4; q++)
			if ((x = this.Block_Obj[this.tBlock].getPattern(this.tBlock_dir)[p][q]) !==0)
				field[this.tBlock_posX + p][this.tBlock_posY + q] = x;

	// 渡されたフィールドオブジェクトの左上に次のブロックを固定する(フィールドにブロックを書き込む)。
	// ■■■ やばい、この処理、実行タイミングの検討がいい加減だ。タイミング的に無駄描き込みがある気がする。
	var y;
	for (var r=0; r<4; r++)
		for (var s=0; s<4; s++)
			if ((y = this.Block_Obj[this.nBlock].getPattern(this.nBlock_dir)[r][s]) !==0) {
				field[r][s] = y;
			} else {
				field[r][s] = 9;
			}
};

Field.prototype.buffDraw = function () {

	// フィールド描画用バッファをフィールドからコピーする。
	for (var i=0; i<25; i++)
		for (var j=0; j<12; j++)
			this.FieldB[j][i] = this.Field[j][i];

	// 現ブロックと次のブロックをフィールド描画用バッファに書き込む。
	this.FieldAddBlock(this.FieldB);

	//画面表示する。
	this.BlockDraw_Obj.Draw(this.FieldB, this.score);
};
// Fieldクラス △△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△

// Gameクラス ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
var Game = function (field /* ■■■ ,title */) {
	this.Field_Obj = field;	// Fieldオブジェクト(ゲーム本体みたいな)格納用
//	this.Title_Obj;			// ■■■ ここに必要になるかもしれないTitle1オブジェクト格納用
	this.GameStatus = 0;	// ゲーム状態 (0:タイトル、1:ゲーム中) ■■■ にする予定

	this.left = [0, 0];		// 左が押されてるかどうか [(0:押されてない、1:押されてる),
							//						 (0:未送信, 他:リピート送信でのカウンタ)]
	this.right = [0, 0];	// 右が押されてるかどうか [同上]
	this.rotate = [0, 0];	// スペースが押されてるかどうか [(0:押されてない、1:押されてる),
							//							   (0:未回転, 1:回転済み)]
	this.down = [0, 0];		// 下が押されてるかどうか [(0:押されてない、1:押されてる),
							//						 (0:ブロック落下前, 1:落下済み)]
	this.eventQ = [null, null, null, null, null, null];	// Fieldオブジェクトに送るイベントキュー
};

Game.prototype.keybdInput = function (keyInput) {
// keyInput:キー入力。文字列。

	switch (keyInput) {
		case "DLFT":	// カーソルキー左押
			this.left[0] = 1;
			break;
		case "ULFT":	// カーソルキー左離
			this.left = [0, 0];
			break;

		case "DRGHT":	// カーソルキー右押
			this.right[0] = 1;
			break;
		case "URGHT":	// カーソルキー右離
			this.right = [0, 0];
			break;

		case "DRTT":	// カーソルキー上(回転)押
		case "DRTT":	// スペース(回転)押
			this.rotate[0] = 1;
			break;

		case "URTT":	// カーソルキー上(回転)離
		case "URTT":	// スペース(回転)離
			this.rotate = [0, 0];
			break;

		case "DDWN":	// カーソルキー下押
			this.down[0] = 1;
			break;
		case "UDWN":	// カーソルキー下離
			this.down = [0, 0];
			break;
	}
};

Game.prototype.mouseInput = function () {
// ■■■ 未実装
};

Game.prototype.timeOut = function () {

	if (this.GameStatus === 0) {
		// ■■■ タイトル画面まだないから、以下暫定処理
		this.Field_Obj.newGame();
		this.GameStatus = 1;
	} else if (this.GameStatus === 1) {
		// イベントキュー設定順リセット
		var evnum = 0;

		// 左移動させるかどうか設定
		if (this.left[0] === 1) {
			if (this.left[1] === 0) {
				this.eventQ[evnum] = "LW";
				this.left[1] = 1;
				evnum++;
			} else if (0<(this.left[1]) && (this.left[1]<3)) {
				this.left[1]++;
			} else if (3 <= this.left[1]) {
				this.eventQ[evnum] = "LW";
				evnum++;
			}
		}
		// 右移動させるかどうか設定
		if (this.right[0] === 1) {
			if (this.right[1] === 0) {
				this.eventQ[evnum] = "RW";
				this.right[1] = 1;
				evnum++;
			} else if ((0<this.right[1]) && (this.right[1]<3)) {
				this.right[1]++;
			} else if (3 <= this.right[1]) {
				this.eventQ[evnum] = "RW";
				evnum++;
			}
		}
		// 回転させるかどうか設定
		if ((this.rotate[0] === 1) && (this.rotate[1] === 0)) {
			this.eventQ[evnum] = "RT";
			this.rotate[1] = 1;
			evnum++;
		}
		// 落下させるかどうか設定
		if ((this.down[0] === 1) && (this.down[1] === 0)) {
			this.eventQ[evnum] = "DW";
			evnum++;
		}
		// 今の所必ず落下設定
		this.eventQ[evnum] = "FA";
		evnum++;
		// イベントキュー最後にnull設定
		this.eventQ[evnum] = null;

		// Fieldオブジェクトにイベントキューを送信し、結果を受信
		var tm = this.Field_Obj.period(this.eventQ);
			// -2  :特に何もなし
			// -1  :接地
			// 0～ :ゲームオーバー(数値は点数)

		// 以下、結果応答に応じた処理を実施する。
		if (tm === -1) {
			// 接地してたら落下フラグリセット(横移動はリセットしなくていいよな)。
			this.down[1] = 1;
		} else if (tm === 99) {
			// ゲームオーバーだったらタイトルへ。
			this.GameStatus = 0;
		}
	}
};
// Gameクラス △△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△△




// 読み込み完了したらinitial()呼ぶように登録しますよと。
window.addEventListener("load", initial);

function initial() {
// htmlとか読み込み完了時に呼ばれる関数。

	var oCanvas;			// canvas
	var BlockDraw_Object;	// BlockDrawオブジェクト格納用
	var Field_Object;		// Fieldオブジェクト格納用
	var Game_Object;		// Gameオブジェクト格納用
/*	var Title_Object;		// ■■■ Titleオブジェクト格納用 */

	oCanvas = document.querySelector("#canvas");		// canvasを特定し選択。
	// 各オブジェクトを作成する。
	var cnvsCntxt = oCanvas.getContext("2d");			// canvasの2Dコンテキストを取得
	BlockDraw_Object = new BlockDraw(0, 0, cnvsCntxt);	// BlockDrawオブジェクトを定義
	Field_Object = new Field(BlockDraw_Object);			// Fieldオブジェクトを定義
	Game_Object = new Game(Field_Object);				// Gameオブジェクトを定義

	// キー押された時の関数
	function KeyDown (e) {
		// ゲームで使用するキーだけ、押されたキーをGameオブジェクトに送信する。
		var downkey = "";
		switch (e.keyCode) {
			case 37:	// カーソルキー左
				downkey = "DLFT";
				break;
			case 39:	// カーソルキー右
				downkey = "DRGHT";
				break;
			case 40:	// カーソルキー下
				downkey = "DDWN";
				break;
			case 38:	// カーソルキー上(回転)
				downkey = "DRTT";
				break;
			case 32:	// スペース(回転)
				downkey = "DRTT";
				break;
		}
		Game_Object.keybdInput(downkey);
	}

	// キー離された時の関数
	function KeyUp (e) {
		// ゲームで使用するキーだけ、離されたキーをGameオブジェクトに送信する。
		var upkey = "";
		switch (e.keyCode) {
			case 37:	// カーソルキー左
				upkey = "ULFT";
				break;
			case 39:	// カーソルキー右
				upkey = "URGHT";
				break;
			case 40:	// カーソルキー下
				upkey = "UDWN";
				break;
			case 38:	// カーソルキー上(回転)
				upkey = "URTT";
				break;
			case 32:	// スペース(回転)
				upkey = "URTT";
				break;
		}
		Game_Object.keybdInput(upkey);
	}

	// タイムアウト処理関数
	function TimeOut() {
		Game_Object.timeOut();
		setTimeout (TimeOut, 34);
	}

	// ゲーム開始
	document.addEventListener("keydown" , KeyDown);
	document.addEventListener("keyup" , KeyUp);
	TimeOut();

/* ■■■ 多分、マウス入力処理で使う。
	// canvas上でクリックされた時に実行する関数を定義する。
	oCanvas.addEventListener("click", function (e) {
		// ブラウザ上のcanvasの座標を参照する。
		var rect = oCanvas.getBoundingClientRect() ;
		var pX = rect.left ;
		var pY = rect.top ;

		// クリックされた時点のブラウザ上のマウスの位置と、上で参照したcanvasの座標から、
		// canvas上のマウスの座標を算出する。
		var oX = e.clientX - pX;
		var oY = e.clientY - pY;
	});
*/

}
