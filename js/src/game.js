var __extends = (this && this.__extends) || (function () {
		var extendStatics = Object.setPrototypeOf ||
			({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
			function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
		return function (d, b) {
			extendStatics(d, b);
			function __() { this.constructor = d; }
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
var BoardManager = /** @class */ (function () {
	function BoardManager() {
	}
	BoardManager.initBoard = function (skipAnimate, addNewUI) {
		if (skipAnimate === void 0) { skipAnimate = false; }
		if (addNewUI === void 0) { addNewUI = true; }
		// console.log("init board called");
		if (addNewUI) {
			var livesUI = new LivesUI();
			var cannon = new Cannon();
			var mainui = new MainUI();
		}
		LivesUI.myRef.livesLeft = LivesUI.myRef.maxLivesLeft = 5;
		Cannon.cannonEnabled = false;
		SimpleGame.myGame.time.events.add(500, function () {
			Cannon.cannonEnabled = true;
		});
		var i = GameConsts.BOARD_HEIGHT;
		while (i-- > 0) {
			var j = GameConsts.BOARD_WIDTH;
			while (j-- > 0) {
				var bubble = new Bubble(Bubble.getRandomColor(true), j, i, 0, skipAnimate);
			}
		}
		var b = new Bubble(Bubble.getRandomColor(), 0, -10, Bubble.STATE_IN_QUEUE);
		BoardManager.addNewBubble();
		if (skipAnimate == false) {
			//SoundManager.play("SOUNDS/INTRO");
			b.firstBubble();
		}
		BoardManager.totalColors = GameConsts.TOTAL_COLORS;
	};
	BoardManager.removeLastRow = function () {
		var arr = Bubble.bubbleArr;
		var i = arr.length;
		var maxBoardCoordY = 0;
		while (i-- > 0) {
			var b = arr[i];
			if (b.boardCoordY > maxBoardCoordY) {
				maxBoardCoordY = b.boardCoordY;
			}
		}
		i = arr.length;
		while (i-- > 0) {
			var b = arr[i];
			if (b.boardCoordY == maxBoardCoordY) {
				b.removeImmediately();
			}
		}
	};
	BoardManager.checkIfArrivedToPosition = function (bubble) {
		var i = Bubble.bubbleArr.length;
		bubble.imgSprite.x += bubble.vx;
		bubble.imgSprite.y += bubble.vy;
		while (i-- > 0) {
			var statBubble = Bubble.bubbleArr[i];
			if (statBubble.isBeingRemoved == false && statBubble.myState == Bubble.STATE_DEFAULT && Util.CircleCollision(bubble.imgSprite, statBubble.imgSprite)) {
				bubble.imgSprite.x -= 0.75 * bubble.vx;
				bubble.imgSprite.y -= 0.75 * bubble.vy;
				return true;
			}
			else if (bubble.imgSprite.y < GameConsts.BUBBLE_SIZE) {
				bubble.imgSprite.y = 0.01 + GameConsts.BUBBLE_SIZE;
				return true;
			}
		}
		bubble.imgSprite.x -= bubble.vx;
		bubble.imgSprite.y -= bubble.vy;
		return false;
	};
	BoardManager.assignStateDefaultCoords = function (bubble) {
		var counter = 0;
		var doneFlag = true;
		do {
			doneFlag = true;
			var bX = bubble.defaultRealX - 0.25 * counter * bubble.vx;
			var bY = bubble.defaultRealY - 0.25 * counter * bubble.vy;
			counter++;
			bX -= GameConsts.INITIAL_X_COORD;
			bY -= GameConsts.INITIAL_Y_COORD;
			var boardCoordY = Math.round(bY / GameConsts.BUBBLE_SIZE);
			if (BoardManager.totalRowsAdded % 2 == 0) {
				bX -= Math.floor(boardCoordY % 2) * GameConsts.BUBBLE_SIZE * 0.5;
			}
			else {
				bX -= Math.floor((boardCoordY + 1) % 2) * GameConsts.BUBBLE_SIZE * 0.5;
			}
			var boardCoordX = Math.round(bX * 0.9999 / (GameConsts.BUBBLE_SIZE));
			bubble.boardCoordX = boardCoordX;
			bubble.boardCoordY = boardCoordY;
			if (bubble.boardCoordX >= GameConsts.BOARD_WIDTH) {
				bubble.boardCoordX--;
			}
			if (bubble.boardCoordX < 0) {
				bubble.boardCoordX = 0;
			}
			var i = Bubble.bubbleArr.length;
			while (i-- > 0) {
				var x = Bubble.bubbleArr[i];
				if (x != bubble) {
					if (x.boardCoordX == bubble.boardCoordX && x.boardCoordY == bubble.boardCoordY) {
						doneFlag = false;
					}
				}
			}
		} while (doneFlag == false);
	};
	BoardManager.boardCoordToRealCoord = function (x, y) {
		if (BoardManager.totalRowsAdded % 2 == 0) {
			return new Phaser.Point(GameConsts.INITIAL_X_COORD + x * GameConsts.BUBBLE_SIZE + Math.floor(y % 2) * GameConsts.BUBBLE_SIZE * 0.5, GameConsts.INITIAL_Y_COORD + y * GameConsts.BUBBLE_SIZE);
		}
		else {
			return new Phaser.Point(GameConsts.INITIAL_X_COORD + x * GameConsts.BUBBLE_SIZE + Math.floor((1 + y) % 2) * GameConsts.BUBBLE_SIZE * 0.5, GameConsts.INITIAL_Y_COORD + y * GameConsts.BUBBLE_SIZE);
		}
	};
	BoardManager.addNewBubble = function () {
		Bubble.queueBubble.myState = Bubble.STATE_READY_TO_LAUNCH;
		Bubble.queueBubble.onUpdate(0);
		Bubble.queueBubble = null;
		var b = new Bubble(Bubble.getRandomColor(), 0, -10, Bubble.STATE_IN_QUEUE);
	};
	// returns matched
	BoardManager.bubbleArrived = function (bubble) {
		BoardManager.markNeighboursOfSameColor(bubble);
		var totalRemoved = BoardManager.removeSameColorCluster();
		if (totalRemoved < 3) {
			LivesUI.loseLife();
		}
		if (totalRemoved >= 3) {
			BoardManager.timeToNewBubble = 30 + 72 * totalRemoved;
			SimpleGame.myGame.time.events.add(72 * totalRemoved, BoardManager.markHangingClustersCall);
			//  SimpleGame.myGame.time.events.add(0.072 * totalRemoved, BoardManager.markHangingClustersCall);
			SimpleGame.myGame.time.events.add(2 * 72 * totalRemoved, BoardManager.markHangingClustersCall);
		}
		if (totalRemoved < 3) {
			return false;
		}
		if (GameConsts.WebAudioSupported == false) {
			// SoundManager._sbang.play();
			SoundManager.playIEPoppingSound(totalRemoved);
		}
		return true;
	};
	BoardManager.markHangingClustersCall = function () {
		BoardManager.markHangingClusters(false);
	};
	BoardManager.markHangingClusters = function (skipScore) {
		if (skipScore === void 0) { skipScore = false; }
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			var b = Bubble.bubbleArr[i];
			b.traversed = false;
			if (b.myState == Bubble.STATE_DEFAULT) {
				b.markedToBeHanged = true;
			}
		}
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			var b = Bubble.bubbleArr[i];
			if (b.boardCoordY == 0) {
				//console.log("initial bubble: " + b.boardCoordX, b.boardCoordY);
				b.traversed = false;
				BoardManager.traverseCluster(b);
				var j = Bubble.bubbleArr.length;
				while (j-- > 0) {
					var b = Bubble.bubbleArr[j];
					b.traversed = false;
				}
			}
		}
		var removeArray = new Array();
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			var b = Bubble.bubbleArr[i];
			if (b.markedToBeHanged) {
				//console.log("hanged: " + b.boardCoordX, b.boardCoordY);
				removeArray.push(b);
				//b.remove();
			}
		}
		if (skipScore == false) {
			if (isNaN(removeArray.length * 100) == false) {
				var i = removeArray.length;
				while (i-- > 0) {
					removeArray[i].assignScore(100);
				}
				// MainUI.myRef.score += removeArray.length * 100;
			}
		}
		var i = removeArray.length;
		BoardManager.markHangedTime = i * 70;
		while (i-- > 0) {
			if (removeArray[i].isBeingRemoved == false) {
				if (GameConsts.WebAudioSupported == false) {
					SimpleGame.myGame.time.events.add(i * 70, function () {
						if (SoundManager.poppingSoundFlag == false) {
							// console.log("play single bubble pop");
							SoundManager._sbang.play();
							SoundManager.poppingSoundFlag = true;
							SimpleGame.myGame.time.events.add(60, function () {
								SoundManager.poppingSoundFlag = false;
							});
						}
						else {
							// console.log("sound still playing");
						}
					});
				}
				//console.log("remove single hanging piece: " + removeArray[i].boardCoordX, removeArray[i].boardCoordY);
				SimpleGame.myGame.time.events.add(i * 70, removeArray[i].remove, removeArray[i]);
			}
		}
	};
	BoardManager.traverseCluster = function (b) {
		b.traversed = true;
		b.markedToBeHanged = false;
		var narr = BoardManager.getNeighoburs(b);
		var i = narr.length;
		while (i-- > 0) {
			var bx = narr[i];
			if (bx.traversed == false && bx.markedToBeRemoved == false) {
				BoardManager.traverseCluster(bx);
			}
		}
	};
	BoardManager.removeSameColorCluster = function () {
		var toBeRemovedCount = 0;
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			if (Bubble.bubbleArr[i].markedToBeRemoved) {
				toBeRemovedCount++;
			}
		}
		var toBeRemovedArr = new Array();
		var removedCount = 0;
		if (toBeRemovedCount > 2) {
			var i = Bubble.bubbleArr.length;
			var removeC = 0;
			while (i-- > 0) {
				if (Bubble.bubbleArr[i].markedToBeRemoved) {
					removedCount++;
					Bubble.bubbleArr[i].assignScore(10 * Math.ceil(removedCount / 3));
					//console.log(MainUI.myRef.score);
					toBeRemovedArr.push(Bubble.bubbleArr[i]);
				}
			}
		}
		toBeRemovedArr.sort(function (b1, b2) {
			if (b1.boardCoordY > b2.boardCoordY) {
				return -1;
			}
			else if (b1.boardCoordY < b2.boardCoordY) {
				return 1;
			}
			else {
				if (b1.boardCoordX > b2.boardCoordX) {
					return 1;
				}
				else {
					return -1;
				}
			}
		});
		var i = toBeRemovedArr.length;
		var i = toBeRemovedArr.length;
		while (i-- > 0) {
			if (toBeRemovedArr[i].markedToBeRemoved) {
				SimpleGame.myGame.time.events.add(70 * (i), toBeRemovedArr[i].remove, toBeRemovedArr[i]);
				//toBeRemovedArr[i].markedToBeRemoved = false;
			}
		}
		if (toBeRemovedCount < 3) {
			var i = Bubble.bubbleArr.length;
			while (i-- > 0) {
				Bubble.bubbleArr[i].markedToBeRemoved = false;
				Bubble.bubbleArr[i].score = 0;
			}
		}
		return toBeRemovedCount;
	};
	BoardManager.markNeighboursOfSameColor = function (bubble) {
		bubble.markForRemoval();
		var nArr = BoardManager.getNeighoburs(bubble);
		var i = nArr.length;
		while (i-- > 0) {
			if ((bubble.myIdx == nArr[i].myIdx) && nArr[i].markedToBeRemoved == false) {
				BoardManager.markNeighboursOfSameColor(nArr[i]);
			}
		}
	};
	BoardManager.getNeighoburs = function (bubble) {
		var neighboursArray = new Array();
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			var bx = Bubble.bubbleArr[i];
			if (bx.myState == Bubble.STATE_DEFAULT) {
				if (BoardManager.areNeighbours(bubble, bx)) {
					neighboursArray.push(bx);
				}
			}
		}
		return neighboursArray;
	};
	BoardManager.areNeighbours = function (b1, b2) {
		if (b1 == b2)
			return false;
		if ((BoardManager.totalRowsAdded + b1.boardCoordY) % 2 == 0) {
			if (b1.boardCoordY == b2.boardCoordY) {
				if (Math.abs(b1.boardCoordX - b2.boardCoordX) <= 1) {
					return true;
				}
				else {
					return false;
				}
			}
			else {
				if (Math.abs(b1.boardCoordY - b2.boardCoordY) > 1)
					return false;
				if (b1.boardCoordX == b2.boardCoordX || b1.boardCoordX - 1 == b2.boardCoordX) {
					return true;
				}
				else {
					return false;
				}
			}
		}
		else {
			if (b1.boardCoordY == b2.boardCoordY) {
				if (Math.abs(b1.boardCoordX - b2.boardCoordX) <= 1) {
					return true;
				}
				else {
					return false;
				}
			}
			else {
				if (Math.abs(b1.boardCoordY - b2.boardCoordY) > 1)
					return false;
				if (b1.boardCoordX == b2.boardCoordX || b1.boardCoordX + 1 == b2.boardCoordX) {
					return true;
				}
				else {
					return false;
				}
			}
			return false;
		}
	};
	BoardManager.addNewRow = function () {
		Cannon.addNewRowInProgress = false;
		BoardManager.colorArr = [0, 0, 0, 0, 0, 0];
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			var colorIdx = Bubble.bubbleArr[i].myIdx;
			BoardManager.colorArr[colorIdx]++;
		}
		// console.log(BoardManager.colorArr);
		BoardManager.totalColors = 0;
		var i = BoardManager.colorArr.length;
		var rowsToAdd = 1;
		while (i-- > 0) {
			if (BoardManager.colorArr[i] == 0) {
				rowsToAdd++;
			}
		}
		BoardManager.totalColors = GameConsts.TOTAL_COLORS - rowsToAdd + 1;
		// console.log("total colors: " + BoardManager.totalColors);
		LivesUI.resetLives();
		while (rowsToAdd-- > 0) {
			BoardManager.addOneRow();
		}
		BoardManager.markHangingClusters(true);
	};
	BoardManager.getByBoardCoord = function (x, y) {
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			if (Bubble.bubbleArr[i].boardCoordX == x && Bubble.bubbleArr[i].boardCoordY == y) {
				return Bubble.bubbleArr[i];
			}
		}
		return null;
	};
	BoardManager.addOneRow = function () {
		//BoardManager.totalRowsAdded++;
		// console.log("NEW ROW ADDED!");
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			var b = Bubble.bubbleArr[i];
			b.boardCoordY++;
			b.setToMyRealCoord();
			b.onUpdate(0);
		}
		i = GameConsts.BOARD_WIDTH;
		while (i-- > 0) {
			var b = new Bubble(Bubble.getRandomColor(), i, 0);
			//var b:Bubble = Bubble.getRandomColor();
		}
		if (SimpleGame.gameOverStartedFlag == false) {
			// console.log("mark hanging clusters");
			// SimpleGame.myGame.time.events.add(0.01, markHangingClusters(true);
			SimpleGame.myGame.time.events.add(50, function () {
				BoardManager.markHangingClusters(true);
			});
		}
	};
	BoardManager.resetBoard = function () {
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			Bubble.bubbleArr[i].removeImmediately();
		}
		BoardManager.initBoard(true, false);
		SimpleGame.gameOverStartedFlag = false;
	};
	BoardManager.isBoardEmpty = function () {
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			if (Bubble.bubbleArr[i].myState == Bubble.STATE_DEFAULT) {
				return false;
			}
		}
		return true;
	};
	BoardManager.deleteOneRow = function () {
		var maxRow = -1;
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			if (Bubble.bubbleArr[i].boardCoordY > maxRow) {
				maxRow = Bubble.bubbleArr[i].boardCoordY;
			}
		}
		i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			if (Bubble.bubbleArr[i].boardCoordY == maxRow) {
				Bubble.bubbleArr[i].removeImmediately();
			}
		}
	};
	BoardManager.changeShootingColor = function () {
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			var b = Bubble.bubbleArr[i];
			if (b.myState == Bubble.STATE_READY_TO_LAUNCH) {
				var idx = ++b.myIdx % 6;
				var b1 = new Bubble(idx, b.boardCoordX, b.boardCoordY, b.myState);
				b.removeImmediately();
			}
		}
	};
	BoardManager.addNewBubblePreStep = function () {
		SimpleGame.myGame.time.events.add(BoardManager.markHangedTime, BoardManager.addNewBubble);
	};
	BoardManager.totalRowsAdded = 0;
	return BoardManager;
}());
var Consts = /** @class */ (function () {
	function Consts() {
	}
	Consts.DELAY_BETWEEN_EVENTS_TOUCH = 200;
	Consts.DELAY_BETWEEN_EVENTS_DESKTOP = 100;
	Consts.timeToHint = 350;
	return Consts;
}());
var mouseIsWithinGame;
var SimpleGame = /** @class */ (function () {
	function SimpleGame() {
		// create our phaser game
		// 800 - width
		// 600 - height
		// Phaser.AUTO - determine the renderer automatically (canvas, webgl)
		// 'content' - the name of the container to add our game to
		// { preload:this.preload, create:this.create} - functions to call for our states
		this.mouseMovedWithinGameTicks = 0;
		this.ticks = 0;
		var config = {
			width: 800,
			height: 600,
			renderer: Phaser.CANVAS,
			parent: 'content',
			disableVisibilityChange: true,
			antialias: false
		};
		this.game = new Phaser.Game(config);
		SimpleGame.myGame = this.game;
		// this.game.physics.startSystem(Phaser.Physics.BOX2D)
		document.body.addEventListener('click', function () {
			// var context = new AudioContext();
			// Setup all nodes
			SimpleGame.myGame.sound.context.resume();
		});
		// this.game.stage.disableVisibilityChange = true;
		// this.game.stage.backgroundColor = 0xffffff;
		// SimpleGame.myGame.stage.visible = false;
		if (SimpleGame.isReleaseVersion) {
			console.log = function () { };
		}
		this.boot = new Phaser.State();
		this.game.state.add("Boot", this.boot, true);
		this.gamestate = new Phaser.State();
		this.gamestate.preload = this.preload;
		this.gamestate.create = this.create;
		this.gamestate.update = this.update;
		this.game.state.add("Gamestate", this.gamestate, false);
		var resizeF = function () {
			// console.log("resize game");
			var deviceWidth = window.outerWidth;
			var deviceHeight = window.outerHeight;
			if (SimpleGame.myGame.device.desktop == false) {
				var scaleX = deviceWidth / 600;
				var scaleY = deviceHeight / 800;
				var scale = Math.min(scaleX, scaleY);
				SimpleGame.myGame.scale.scaleMode = Phaser.ScaleManager.USER_SCALE;
				SimpleGame.myGame.scale.setUserScale(scale, scale);
				// console.log("set to user scale: " + scale, scaleX, scaleY);
				SimpleGame.myGame.scale.pageAlignHorizontally = true;
			}
			else {
				SimpleGame.myGame.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
				SimpleGame.myGame.scale.pageAlignVertically = true;
				SimpleGame.myGame.scale.pageAlignHorizontally = true;
			}
			SimpleGame.myGame.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
			SimpleGame.myGame.scale.pageAlignVertically = true;
			SimpleGame.myGame.scale.pageAlignHorizontally = true;
			SimpleGame.myGame.scale.refresh();
		};
		this.boot.preload = function () {
			SimpleGame.myGame.stage.disableVisibilityChange = true;
			// this.game.load.image( 'logo', "assets/splash.png" );
			this.game.load.image('logo', "assets/1_loading/loading_bg.png");
			this.game.stage.backgroundColor = 0xffffff;
			// this.game.scale.pageAlignVertically = true;
			// this.game.scale.pageAlignHorizontally = true;
			// SimpleGame.myGame.input.mspointer.stop()
			window.addEventListener("resize", resizeF);
			SimpleGame.myGame.stage.disableVisibilityChange = true;
			resizeF();
			// console.log("scale mode: " + this.game.scale.scaleMode);
			this.game.time.advancedTiming = true;
			// this.game.scale.setMinMax(0, 0, window.innerWidth, window.innerHeight);
			this.game.scale.refresh();
			// console.log("height: " + window.innerHeight + ", " + window.innerWidth + ", " + this.game.height + "," + this.game.scale.sourceAspectRatio);
			// console.log(window.screen.width, window.screen.height)
			// console.log(window.outerWidth, window.outerHeight)
		};
		this.boot.create = function () {
			// SimpleGame.logo = this.game.add.sprite( 0, 0, 'logo' );
			// SimpleGame.logo.visible = true;
			this.game.state.start("Gamestate");
		};
		// console.log(Phaser.VERSION);
	}
	SimpleGame.prototype.preload = function () {
		// add our logo image to the assets class under the
		// key 'logo'. We're also setting the background colour
		// so it's the same as the background colour in the image
		// SimpleGame.logo = this.game.add.sprite( 0, 0, 'logo' );
		// SimpleGame.logo.visible = false;
		SimpleGame.preloadPrompt = new Preload();
		// SimpleGame.logo.visible = true;
		var i = 5;
		while (i-- > 1) {
			this.game.load.image('ani_blue_' + i, "assets/2_game/bubbles/animation/ani_blue_" + i + ".png");
			this.game.load.image('ani_green_' + i, "assets/2_game/bubbles/animation/ani_green_" + i + ".png");
			this.game.load.image('ani_lightblue_' + i, "assets/2_game/bubbles/animation/ani_lightblue_" + i + ".png");
			this.game.load.image('ani_purple_' + i, "assets/2_game/bubbles/animation/ani_purple_" + i + ".png");
			this.game.load.image('ani_red_' + i, "assets/2_game/bubbles/animation/ani_red_" + i + ".png");
			this.game.load.image('ani_yellow_' + i, "assets/2_game/bubbles/animation/ani_yellow_" + i + ".png");
		}
		this.game.load.image('bubble_blue', "assets/2_game/bubbles/bubble_blue.png");
		this.game.load.image('bubble_green', "assets/2_game/bubbles/bubble_green.png");
		this.game.load.image('bubble_lightblue', "assets/2_game/bubbles/bubble_lightblue.png");
		this.game.load.image('bubble_purple', "assets/2_game/bubbles/bubble_purple.png");
		this.game.load.image('bubble_red', "assets/2_game/bubbles/bubble_red.png");
		this.game.load.image('bubble_yellow', "assets/2_game/bubbles/bubble_yellow.png");
		this.game.load.image('btn_help', "assets/2_game/menu/btn_help.png");
		this.game.load.image('btn_moregames', "assets/2_game/menu/btn_moregames.png");
		this.game.load.image('btn_restart', "assets/2_game/menu/btn_restart.png");
		this.game.load.image('btn_sound', "assets/2_game/menu/btn_sound.png");
		this.game.load.image('btn_top10', "assets/2_game/menu/btn_top10.png");
		this.game.load.image('novice', "assets/2_game/menu/novice.png");
		i = 10;
		while (i-- > 0) {
			this.game.load.image('score_digit_' + i, "assets/2_game/menu/score_digit_" + i + ".png");
		}
		this.game.load.image('prompt_button_cancel', "assets/2_game/prompts/prompt_button_cancel.png");
		this.game.load.image('prompt_button_ok', "assets/2_game/prompts/prompt_button_ok.png");
		this.game.load.image('prompt_enter-name', "assets/2_game/prompts/prompt_enter-name.png");
		this.game.load.image('prompt_game_over', "assets/2_game/prompts/prompt_game_over.png");
		this.game.load.image('prompt_help', "assets/2_game/prompts/prompt_help.png");
		this.game.load.image('prompt_top10', "assets/2_game/prompts/prompt_top10.png");
		this.game.load.image('canon', "assets/2_game/canon.png");
		this.game.load.image('levels_ball_empty', "assets/2_game/levels_ball_empty.png");
		this.game.load.image('game_bg', "assets/2_game/game_bg.png");
		this.game.load.image('loading_bg', "assets/1_loading/loading_bg.png");
		this.game.load.audio('1__sstart', ['assets/sound/1__sstart.mp3', 'assets/sound/1__sstart.ogg']);
		this.game.load.audio('2__sconnect', ['assets/sound/2__sconnect.mp3', 'assets/sound/2__sconnect.ogg']);
		this.game.load.audio('3__sbang', ['assets/sound/3__sbang.mp3', 'assets/sound/3__sbang.ogg']);
		this.game.load.audio('3__sbang_3', ['assets/sound/3__sbang_3.mp3', 'assets/sound/3__sbang_3.ogg']);
		this.game.load.audio('3__sbang_4', ['assets/sound/3__sbang_4.mp3', 'assets/sound/3__sbang_4.ogg']);
		this.game.load.audio('3__sbang_5', ['assets/sound/3__sbang_5.mp3', 'assets/sound/3__sbang_5.ogg']);
		this.game.load.audio('4__sdown', ['assets/sound/4__sdown.mp3', 'assets/sound/4__sdown.ogg']);
		this.game.load.audio('5__sgo', ['assets/sound/5__sgo.mp3', 'assets/sound/5__sgo.ogg']);
	};
	SimpleGame.gameOverStarted = function (gameWon) {
		if (gameWon === void 0) { gameWon = false; }
		if (SimpleGame.gameOverStartedFlag == false) {
			SimpleGame.gameOverStartedFlag = true;
			var gameOver = new GameOver(MainUI.myRef.score, gameWon);
		}
	};
	SimpleGame.prototype.testF = function () {
	};
	SimpleGame.onPausedUnpaused = function () {
		// SimpleGame.myGame.input.mspointer.stop()
	};
	SimpleGame.prototype.create = function () {
		this.game.input.maxPointers = 1;
		SoundManager._sstart = this.game.add.audio('1__sstart');
		SoundManager._sconnect = this.game.add.audio('2__sconnect');
		SoundManager._sbang = this.game.add.audio('3__sbang');
		SoundManager._sbang_3 = this.game.add.audio('3__sbang_3');
		SoundManager._sbang_4 = this.game.add.audio('3__sbang_4');
		SoundManager._sbang_5 = this.game.add.audio('3__sbang_5');
		SoundManager._sdown = this.game.add.audio('4__sdown');
		SoundManager._sgo = this.game.add.audio('5__sgo');
		// SoundManager._sbang_3.play();
		// SoundManager._sbang_3.onStop.addOnce( function()
		// 	{
		// 		SoundManager._sbang_4.play()
		// 	},
		//  this )
		SimpleGame.myGame.onFocus.add(function () {
			// console.log("onPaused");
			SimpleGame.onPausedUnpaused();
		}, this);
		SimpleGame.myGame.onBlur.add(function () {
			// console.log("onUnpaused");
			SimpleGame.onPausedUnpaused();
		}, this);
		// SimpleGame.myGame.time.events.add(10, this.testF, this)
		SimpleGame.myGame.stage.smoothed = true;
		// SimpleGame.myGame.antialias = true;
		SimpleGame.myGame.stage.disableVisibilityChange = true;
		SimpleGame.myGame.scale.forceOrientation(false, false);
		SimpleGame.myGame.scale.enterIncorrectOrientation.add(function () {
			SimpleGame.myGame.time.events.add(1, function () {
				var deviceWidth = window.innerWidth;
				var deviceHeight = window.innerHeight;
				var isIframed = false;
				if (window.self !== window.top) {
					isIframed = true;
				}
				if (isIframed)
					return;
				// console.log("add turn image");
				// SimpleGame.myGame.scale.setGameSize(window.innerWidth, window.innerHeight)
				// SimpleGame.myGame.scale.currentScaleMode = Phaser.ScaleManager.NO_SCALE
				// SimBpleGame.myGame.renderer.resize(window.innerWidth,window.innerHeight)
				SimpleGame.myGame.input.enabled = false;
				// this.turnImage.rotation = Math.PI/2;
				var splash = document.getElementById('splash');
				if (splash) {
					splash.parentNode.removeChild(splash);
				}
			}, this);
		}, this);
		SimpleGame.myGame.scale.leaveIncorrectOrientation.add(function () {
			// console.log(window.innerWidth, window.innerHeight, window.outerWidth, window.outerHeight)
			// SimpleGame.myGame.scale.setGameSize(800, 600)
			var deviceWidth = window.outerWidth;
			var deviceHeight = window.outerHeight;
			SimpleGame.myGame.input.enabled = true;
			if (deviceWidth < deviceHeight) {
			}
			else {
			}
			// this.whitefg.destroy();
		}, this);
		SoundManager.init();
		this.ticks = 0;
		var text = this.game.add.text(870, 32, '', { font: "35px Comic Sans MS", fill: "#ff0000" });
		text.text = "super";
		// this.game.physics.enable(logo, Phaser.Physics.ARCADE);
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		// var key1 = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		var key2 = this.game.input.keyboard.addKey(Phaser.Keyboard.Q);
		var key3 = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		var sBind;
		key3.onDown.add(function () {
			if (!SimpleGame.promptActive) {
				Bubble.changeLaunchBubbleColor();
			}
		});
		key2.onDown.add(function () {
			if (!SimpleGame.promptActive) {
				BoardManager.removeLastRow();
			}
		});
		// key1.onDown.add( function()
		// {
		// 	if (GameStart.gamestartFlagActive)
		// 	{
		// 		GameStart.myref.remove()
		// 	}
		// 	else if (InitMenuPrompt.myref != null)
		// 	{
		// 		InitMenuPrompt.myref.onTap()
		// 	}
		// 	// ReadyPrompt.removeAll()
		// 	// BoardManager.Undo()
		// }, this)
		text.visible = false;
		SimpleGame.game_bg = this.game.add.sprite(0, 0, 'game_bg');
		SimpleGame.game_bg.visible = false;
		// console.log("check assets loaded");
		// checkAssetsLoaded();
		SimpleGame.checkAssetsLoaded();
		SimpleGame.myGame.input.onUp.add(SimpleGame.onPointerUp, this);
		SimpleGame.myGame.input.onTap.add(SimpleGame.onPointerDown, this);
		SimpleGame.myGame.input.mspointer.capture = false;
		document.addEventListener('contextmenu', function (event) { return event.preventDefault(); });
	};
	SimpleGame.onPointerDown = function () {
		SimpleGame.pointerDown = true;
		//   console.log("input down")
		if (SimpleGame.myGame.device.android == true && SimpleGame.myGame.device.desktop == false && SimpleGame.myGame.scale.isFullScreen == false) {
			// console.log("start full screen");
			// SimpleGame.myGame.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
			// SimpleGame.myGame.scale.startFullScreen(false);
		}
	};
	SimpleGame.onPointerUp = function () {
		SimpleGame.pointerDown = false;
		//  console.log("input up")
	};
	SimpleGame.checkAssetsLoaded = function () {
		// console.log("check assets loaded entered");
		SimpleGame.addInitScreen();
	};
	SimpleGame.addInitScreen = function () {
		var splash = document.getElementById('splash');
		if (splash) {
			splash.parentNode.removeChild(splash);
		}
		// console.log("add init screen");
		// SimpleGame.logo.visible = false;
		SimpleGame.preloadPrompt.remove();
		SimpleGame.myGame.time.events.add(1, function () {
			SimpleGame.startGame(true);
		}, this);
	};
	SimpleGame.startGame = function (firstGame) {
		if (firstGame) {
			SimpleGame.gameEngineStarted = true;
			SimpleGame.game_bg.visible = true;
			// SimpleGame.logo.visible = false;
			BoardManager.initBoard();
			if (SimpleGame.myGame.device.safari == false && SimpleGame.myGame.device.firefox == false && SimpleGame.myGame.input.touch && (SimpleGame.myGame.device.android || SimpleGame.myGame.device.iOS)) {
				SimpleGame.myGame.input.mouse.stop();
			}
			else if (SimpleGame.myGame.device.safari == false && SimpleGame.myGame.device.firefox == false && SimpleGame.myGame.device.ie == false && SimpleGame.myGame.input.touch) {
				SimpleGame.myGame.input.mouse.stop();
			}
		}
		else {
			// GameUI.reinitData()
			BoardManager.initBoard();
		}
		// if (SimpleGame.myGame.device.firefox)
		// {
		// 	SimpleGame.myGame.input.mouse.start()
		// }
	};
	SimpleGame.prototype.update = function () {
		//   console.log( SimpleGame.myGame.input.enabled)
		// console.log(SimpleGame.myGame.input.totalActivePointers, SimpleGame.myGame.input.mspointer)
		// if (this.whitefg)
		// {
		// 	this.game.world.bringToTop(this.whitefg)
		// }
		if (SimpleGame.myGame.device.android) {
			SimpleGame.myGame.input.mspointer.start();
			SimpleGame.myGame.input.touch.stop();
			SimpleGame.myGame.input.mouse.stop();
		}
		// console.log(SimpleGame.myGame.input.mspointer.capture)
		if (SimpleGame.gameEngineStarted == false)
			return;
		// if (GameUI.promptLayer.countLiving() > 0)
		// {
		// 	//   console.log("prompt exists", this.ticks % 12, this.ticks)
		// 	SimpleGame.myGame.input.mspointer.capture = false;
		// 	if (this.ticks % 12 == 1)
		// 	{
		// 		// SimpleGame.myGame.input.reset();
		// 		// console.log("input reset")
		// 	}
		// }
		// else
		// {
		// 	SimpleGame.myGame.input.mspointer.capture = false;
		// }
		// GameUI.update();
		SimpleGame.myGame.input.update();
		// console.log(this.game.device.touch)
		// SimpleGame.myGame.input.mouse.enabled = !SimpleGame.myGame.device.mspointer;
		// this.game.debug.text("" + this.game.time.fps, 2, 14, "#00ff00");
		//  console.log(SimpleGame.myGame.input.activePointer.exists, SimpleGame.myGame.input.activePointer.withinGame, mouseIsWithinGame);
		var mouseIsMovedWithinGame;
		if (this.lastMouseCoordX != SimpleGame.myGame.input.x || this.lastMouseCoordY != SimpleGame.myGame.input.y) {
			mouseIsMovedWithinGame = true;
			this.mouseMovedWithinGameTicks++;
		}
		else {
			mouseIsMovedWithinGame = false;
			this.mouseMovedWithinGameTicks = 0;
		}
		this.lastMouseCoordX = SimpleGame.myGame.input.x;
		this.lastMouseCoordY = SimpleGame.myGame.input.y;
		if (SimpleGame.pointerDown == false && this.mouseMovedWithinGameTicks > 5 && SimpleGame.myGame.input.activePointer.withinGame == false) {
			// SimpleGame.unselectAllCards = true;
		}
		else {
			// SimpleGame.unselectAllCards = false;
		}
		// console.log("mouse moved within game: " + mouseIsMovedWithinGame)
		// console.log("unselect all cards: " + SimpleGame.unselectAllCards)
	};
	SimpleGame.fontsLoadedFlag = true;
	SimpleGame.gameEngineStarted = false;
	SimpleGame.unselectAllCards = false;
	SimpleGame.isReleaseVersion = false;
	SimpleGame.pointerDown = false;
	SimpleGame.gameOverStartedFlag = false;
	SimpleGame.promptActive = false;
	return SimpleGame;
}());
function onLogoClicked() {
	// console.log("start fullscreen");
	// var card:Card = new Card(1,2);
	// this.game.scale.startFullScreen();
}
// when the page has finished loading, create our game
window.onload = function () {
	var game = new SimpleGame();
};
var GameConsts = /** @class */ (function () {
	function GameConsts() {
	}
	GameConsts.WIDTH = 800;
	GameConsts.HEIGHT = 600;
	GameConsts.WIDTH_0 = 800;
	GameConsts.HEIGHT_0 = 600;
	GameConsts.CRAZYMODE = true;
	// public static layerRotate:Entity;
	GameConsts.SMALL_DEVICE_MODE = false;
	GameConsts.WebAudioSupported = false;
	GameConsts.MOBILE_BROWSER = true;
	GameConsts.TOTAL_LEVELS = 3;
	GameConsts.LEVEL_1 = 0;
	GameConsts.LEVEL_2 = 1;
	GameConsts.LEVEL_3 = 2;
	GameConsts.LEVEL_TIME = [8 * 60, 7 * 60, 14 * 60];
	GameConsts.BOARD_WIDTH = 17;
	GameConsts.BOARD_HEIGHT = 9;
	GameConsts.BUBBLE_SIZE = 32;
	GameConsts.INITIAL_X_COORD = 40;
	GameConsts.INITIAL_Y_COORD = 40;
	GameConsts.LAUNCH_POWER = 18;
	GameConsts.RIGHT_BOARD_BORDER = 25 + 560 - 24;
	GameConsts.LEFT_BOARD_BORDER = 25 + 12;
	GameConsts.TOTAL_COLORS = 6;
	GameConsts.CHEAT_MODE = false;
	return GameConsts;
}());

var Preload = /** @class */ (function () {
	function Preload() {
		this.loaded = 0;
		SimpleGame.logo = SimpleGame.myGame.add.sprite(0, 0, 'logo');
		this.gameovertxt = SimpleGame.myGame.make.text(800 / 2, 600 / 2, "Bubble Shooter is loading ", { font: "42px Arial", fill: "#ffffff", fontWeight: "700", align: "Right" });
		this.gameovertxt.anchor.set(0.5, 0.5);
		this.preloadLayer = SimpleGame.myGame.add.group();
		this.preloadLayer.add(this.gameovertxt);
		this.myEvent = SimpleGame.myGame.time.events.loop(10, this.update, this);
		// this.loadingbar = SimpleGame.myGame.make.graphics(250,300)
		// this.loadingbar.beginFill(0xffffff)
		// this.loadingbar.drawRect(0, 0, 300,10)
		// this.loadingbar.endFill();
		// this.preloadLayer.add(this.loadingbar)
		// SimpleGame.logo.visible = false;
	}
	Preload.prototype.update = function () {
		this.loaded += 2;
		if (this.loaded > 100) {
			this.loaded = 100;
		}
		this.gameovertxt.text = "Loading: " + this.loaded + "%";
		// SimpleGame.myGame.time.events.add(3, this.update, this)
		// this.loadingbar.width = 3 * this.loaded
		// this.loadingbar.clear();
	};
	Preload.prototype.remove = function () {
		SimpleGame.myGame.time.events.remove(this.myEvent);
		this.preloadLayer.destroy();
	};
	return Preload;
}());
var SoundManager = /** @class */ (function () {
	// static   poppingSoundFlag:boolean;
	function SoundManager() {
	}
	SoundManager.playClick = function () {
		if (SoundManager.canPlayClick) {
			// console.log("play CLICK");
			SoundManager.click.play();
			SoundManager.canPlayClick = false;
			// console.log("cannot play click")
			SimpleGame.myGame.time.events.add(100, function () {
				// console.log("can play click")
				SoundManager.canPlayClick = true;
			}, this);
		}
	};
	SoundManager.init = function () {
		SoundManager.sManager = new Phaser.SoundManager(SimpleGame.myGame);
		// SoundManager.dealcards.allowMultiple = true;
		// SoundManager.hint.volume = 0.7;
	};
	SoundManager.playGrabCard = function () {
		if (SoundManager.canPlayGrab) {
			//  console.log("play CLICK")
			SoundManager.grabcard.play();
			SoundManager.canPlayGrab = false;
			// console.log("cannot play click")
			SimpleGame.myGame.time.events.add(100, function () {
				// console.log("can play click")
				SoundManager.canPlayGrab = true;
			}, this);
		}
	};
	SoundManager.setMuteFlags = function (muteFlag) {
		SoundManager._sstart.mute = muteFlag;
		SoundManager._sconnect.mute = muteFlag;
		SoundManager._sbang.mute = muteFlag;
		SoundManager._sbang_3.mute = muteFlag;
		SoundManager._sbang_4.mute = muteFlag;
		SoundManager._sbang_5.mute = muteFlag;
		SoundManager._sdown.mute = muteFlag;
		SoundManager._sgo.mute = muteFlag;
	};
	SoundManager.playDealRow = function () {
		SoundManager.timesToPlayDealSound = 10;
		SoundManager.playDealRowSound();
	};
	SoundManager.playDealRowSound = function () {
		SoundManager.dealcards.position = 200;
		SoundManager.dealcards.update();
		SoundManager.dealcards.play();
		// console.log("play dealcards sound");
		SoundManager.timesToPlayDealSound--;
		if (SoundManager.timesToPlayDealSound > 0) {
			SimpleGame.myGame.time.events.add(44, function () {
				SoundManager.playDealRowSound();
			});
		}
	};
	SoundManager.playIEPoppingSound = function (totalRemoved) {
		SoundManager.soundsDelta = [0, 0, 0, 1000 * this._sbang_3.totalDuration, 1000 * this._sbang_4.totalDuration, 1000 * this._sbang_5.totalDuration];
		// console.log(this._sbang_3.totalDuration, this._sbang_4.totalDuration, this._sbang_5.totalDuration);
		if (SimpleGame.myGame.device.ie == false)
			return;
		// console.log("play IE popping sound");
		if (totalRemoved < 3 && totalRemoved > 0) {
			this._sbang.play();
		}
		var toRemove = totalRemoved;
		var iterations = 0;
		SoundManager.playPopArray = [];
		var iterationsDelta = 0;
		do {
			var soundToPlay;
			var toRemoveLeft;
			if (toRemove > 5) {
				soundToPlay = 5;
				toRemoveLeft = toRemove - 5;
				if (toRemoveLeft < 3) {
					soundToPlay = 4;
					toRemoveLeft = toRemove - 4;
					if (toRemoveLeft < 3) {
						soundToPlay = 3;
						toRemoveLeft = toRemove - 3;
					}
				}
			}
			else {
				soundToPlay = toRemove;
			}
			toRemove -= soundToPlay;
			if (soundToPlay < 3) {
				break;
			}
			// console.log("iterations delta: " + iterationsDelta, soundToPlay);
			if (iterationsDelta > -1) {
				if (soundToPlay == 3) {
					SimpleGame.myGame.time.events.add(iterationsDelta, SoundManager.playIESound3, this);
				}
				else if (soundToPlay == 4) {
					SimpleGame.myGame.time.events.add(iterationsDelta, SoundManager.playIESound4, this);
				}
				else if (soundToPlay == 5) {
					SimpleGame.myGame.time.events.add(iterationsDelta, SoundManager.playIESound5, this);
				}
			}
			else {
				SoundManager.playIEPoppingSoundSingle(soundToPlay);
			}
			iterationsDelta += 0.7 * SoundManager.soundsDelta[soundToPlay];
		} while (toRemove >= 0);
		SoundManager.poppingSoundFlag = true;
		SimpleGame.myGame.time.events.add(iterationsDelta, function () {
			SoundManager.poppingSoundFlag = false;
		});
	};
	SoundManager.playIESound5 = function () {
		// SoundManager.playIEPoppingSoundSingle(5);
		this._sbang_5.play("", 1000 * 0.3 * this._sbang_5.totalDuration);
		// this._sbang_5.play("", 0.2*this._sbang_5.totalDuration)
		// console.log("play ie 5");
	};
	SoundManager.playIESound4 = function () {
		// SoundManager.playIEPoppingSoundSingle(4);
		// this._sbang_4.play()
		this._sbang_4.play("", 1000 * 0.3 * this._sbang_4.totalDuration);
		// this._sbang_4.play("", 0.2*this._sbang_4.totalDuration)
		// console.log("play ie 4");
	};
	SoundManager.playIESound3 = function () {
		// this._sbang_3.play()
		this._sbang_3.play("", 1000 * 0.3 * this._sbang_3.totalDuration);
		// this._sbang_3.play("", 0.2*this._sbang_3.totalDuration)
		// console.log("play ie 3");
	};
	SoundManager.playIEPoppingSoundSingle = function (count) {
		// this._sbang.play()
	};
	SoundManager.timesToPlayDealSound = 10;
	SoundManager.canPlayClick = true;
	SoundManager.canPlayGrab = true;
	SoundManager.muteFlag = false;
	SoundManager.soundsDelta = [0, 0, 0, 0.29 * 1000, 0.38 * 1000, 0.47 * 1000];
	SoundManager.matchesInRow = 0;
	return SoundManager;
}());
var OpenMenuBut = /** @class */ (function () {
	function OpenMenuBut() {
		SimpleGame.myGame.add.button();
	}
	return OpenMenuBut;
}());
var SelectTableButton = /** @class */ (function () {
	function SelectTableButton(number, parent, state_normal_img, state_normal_img_over, state_selected_img, state_selected_img_over, x, y, selected) {
		if (selected === void 0) { selected = false; }
		this.selected = selected;
		this.number = number;
		this.buttonNormal = new ButtonWithOverState(parent, state_normal_img, state_normal_img_over, x, y, this.toggleButton.bind(this));
		this.buttonSelected = new ButtonWithOverState(parent, state_selected_img, state_selected_img_over, x, y, this.toggleButton.bind(this));
		this.setCorrectButtonVisible(true);
	}
	SelectTableButton.prototype.toggleButton = function () {
		// SoundButton.soundFlag = !SoundButton.soundFlag;
		this.selected = !this.selected;
		// console.log("sound flag: " + SoundButton.soundFlag)
		this.setCorrectButtonVisible(true);
		// SoundManager.setMuteFlags(!SoundButton.soundFlag);
		// console.log("mute flag: " + SoundManager.sManager.mute)
	};
	SelectTableButton.prototype.setCorrectButtonVisible = function (skipButtonOver) {
		if (skipButtonOver === void 0) { skipButtonOver = false; }
		// console.log("set correct but visible: ", this.selected);
		if (!this.selected) {
			this.buttonNormal.setVisible();
			this.buttonSelected.setInvisible();
			if (this.buttonNormal.imgNormal.input != null)
				this.buttonNormal.imgNormal.input.useHandCursor = true;
			if (!skipButtonOver)
				this.buttonNormal.onButtonOver();
		}
		else {
			this.buttonNormal.setInvisible();
			this.buttonSelected.setVisible();
			if (!skipButtonOver)
				this.buttonSelected.onButtonOver();
		}
	};
	return SelectTableButton;
}());
var SoundButton = /** @class */ (function () {
	function SoundButton(parent, imgNormalName, imgOverName, imgNormalName_Off, imgOverName_Off, x, y) {
		this.soundOnBut = new ButtonWithOverState(parent, imgNormalName, imgOverName, x, y, this.toggleSoundButton.bind(this));
		this.soundOnBut.setXY(x, y);
		this.soundOffBut = new ButtonWithOverState(parent, imgNormalName_Off, imgOverName_Off, x, y, this.toggleSoundButton.bind(this));
		this.soundOffBut.setXY(x, y);
		this.setCorrectButtonVisible(true);
	}
	SoundButton.prototype.toggleSoundButton = function () {
		SoundButton.soundFlag = !SoundButton.soundFlag;
		// console.log("sound flag: " + SoundButton.soundFlag)
		this.setCorrectButtonVisible();
		SoundManager.setMuteFlags(!SoundButton.soundFlag);
		// console.log("mute flag: " + SoundManager.sManager.mute)
	};
	SoundButton.prototype.setCorrectButtonVisible = function (skipButtonOver) {
		if (skipButtonOver === void 0) { skipButtonOver = false; }
		// console.log("set correct but visible")
		if (SoundButton.soundFlag) {
			this.soundOnBut.setVisible();
			this.soundOffBut.setInvisible();
			if (!skipButtonOver)
				this.soundOnBut.onButtonOver();
		}
		else {
			this.soundOnBut.setInvisible();
			this.soundOffBut.setVisible();
			if (!skipButtonOver)
				this.soundOffBut.onButtonOver();
		}
	};
	SoundButton.soundFlag = true;
	return SoundButton;
}());
var Bubble = /** @class */ (function () {
	function Bubble(myIdx, boardCoordX, boardCoordY, myState, skipAnimate) {
		if (myState === void 0) { myState = 0; }
		if (skipAnimate === void 0) { skipAnimate = false; }
		this.isBeingRemoved = false;
		this.score = 0;
		this.markedToBeRemoved = false;
		this.traversed = false;
		this.markedToBeHanged = false;
		this.banBubbleFromShooting = false;
		this.myState = myState;
		if (Bubble.bubbleArr == null) {
			Bubble.bubbleArr = new Array();
		}
		this.myIdx = myIdx;
		this.deltaRealX = 0;
		this.deltaRealY = 0;
		Bubble.bubbleArr.push(this);
		this.boardCoordY = boardCoordY;
		this.boardCoordX = boardCoordX;
		this.myIdx = myIdx;
		// this.imgSprite = new ImageSprite(GameContext.pack.getTexture("bubbles/" + bubbleImgNameArr[myIdx] ));
		this.imgSprite = SimpleGame.myGame.add.sprite(0, 0, Bubble.bubbleImgNameArr[myIdx]);
		this.setToMyRealCoord();
		// this.imgSprite.disablePointer();
		//imgSprite.centerAnchor();
		// this.imgSprite.alpha._ = 0;
		var boardCoordYCorrected = boardCoordY;
		if (boardCoordYCorrected < 0) {
			boardCoordYCorrected = 0;
		}
		// var alphaDelay:Float = 0.19 * boardCoordYCorrected + 0.01 * boardCoordX;
		// if (skipAnimate)
		// {
		// 	alphaDelay = 0;
		// }
		this.imgSprite.anchor.set(0.5, 0.5);
		if (myState == Bubble.STATE_READY_TO_LAUNCH) {
			this.imgSprite.x = GameConsts.WIDTH * 0.5;
			this.imgSprite.y = GameConsts.HEIGHT * 0.95;
		}
		this.onUpdate(0);
		this.timerEvent = SimpleGame.myGame.time.events.loop(15, this.onUpdate, this);
	}
	Bubble.changeLaunchBubbleColor = function () {
		var i = this.bubbleArr.length;
		while (i-- > 0) {
			if (this.bubbleArr[i].myState == Bubble.STATE_READY_TO_LAUNCH) {
				this.bubbleArr[i].changeColor();
			}
		}
	};
	Bubble.prototype.changeColor = function () {
		this.myIdx = (this.myIdx + 1) % BoardManager.totalColors;
		var x = this.imgSprite.x;
		var y = this.imgSprite.y;
		this.imgSprite.destroy();
		this.imgSprite = SimpleGame.myGame.add.sprite(x, y, Bubble.bubbleImgNameArr[this.myIdx]);
		this.imgSprite.anchor.set(0.5, 0.5);
	};
	Bubble.prototype.firstBubble = function () {
		this.banBubbleFromShooting = true;
		// delay shooting
		//  SimpleGame.myGame.time.events.add(1.5, function()
		// {
		// 	banBubbleFromShooting = false;
		// }, owner );
	};
	Bubble.getRandomColor = function (fullyRandom) {
		if (fullyRandom === void 0) { fullyRandom = false; }
		var availableColorIdx = [false, false, false, false, false, false];
		if (fullyRandom == false) {
			var i = Bubble.bubbleArr.length;
			while (i-- > 0) {
				availableColorIdx[Bubble.bubbleArr[i].myIdx] = true;
			}
			var randColor;
			do {
				randColor = Math.floor(Math.random() * 6);
			} while (availableColorIdx[randColor] == false);
			return randColor;
		}
		else {
			return Math.floor(Math.random() * GameConsts.TOTAL_COLORS);
		}
	};
	Bubble.prototype.launch = function (angle, distance) {
		// console.log("launch!");
		this.myState = Bubble.STATE_LAUNCHED;
		// trace("launch called: " + myState, vx, vy, angle, distance);
		var angle = (angle + 90) * Math.PI / 180;
		// if (angle < 0.14 && angle > -Math.PI*0.5)
		// {
		// 	angle = 0.14;
		// }
		// else if (angle < -Math.PI * 0.5)
		// {
		// 	angle = 3;
		// }
		// if (angle > 3.0)
		// {
		// 	angle = 3.0;
		// }
		this.vx = -GameConsts.LAUNCH_POWER * Math.cos(angle);
		this.vy = -GameConsts.LAUNCH_POWER * Math.sin(angle);
		SoundManager._sstart.play();
		// console.log("speed: " + this.vx, this.vy);
	};
	Bubble.prototype.setToMyRealCoord = function (immediateFlag) {
		if (immediateFlag === void 0) { immediateFlag = true; }
		if (BoardManager.totalRowsAdded % 2 == 0) {
			this.defaultRealX = GameConsts.INITIAL_X_COORD + this.boardCoordX * GameConsts.BUBBLE_SIZE + Math.floor(this.boardCoordY % 2) * GameConsts.BUBBLE_SIZE * 0.5;
			this.defaultRealY = GameConsts.INITIAL_Y_COORD + this.boardCoordY * GameConsts.BUBBLE_SIZE;
		}
		else {
			this.defaultRealX = GameConsts.INITIAL_X_COORD + this.boardCoordX * GameConsts.BUBBLE_SIZE + Math.floor((this.boardCoordY + 1) % 2) * GameConsts.BUBBLE_SIZE * 0.5;
			this.defaultRealY = GameConsts.INITIAL_Y_COORD + this.boardCoordY * GameConsts.BUBBLE_SIZE;
		}
		//trace(defaultRealX, defaultRealY);
		if (this.myState == Bubble.STATE_READY_TO_LAUNCH) {
			this.defaultRealX = GameConsts.WIDTH * 0.37;
			this.defaultRealY = GameConsts.HEIGHT * 0.92;
		}
		if (immediateFlag) {
			this.imgSprite.x = this.defaultRealX;
			this.imgSprite.y = this.defaultRealY;
		}
		else {
			SimpleGame.myGame.add.tween(this.imgSprite).to({ x: this.defaultRealX, y: this.defaultRealY }, 90, Phaser.Easing.Linear.None, true);
		}
	};
	Bubble.prototype.markForRemoval = function () {
		this.markedToBeRemoved = true;
	};
	Bubble.prototype.assignScore = function (score) {
		this.score = score;
	};
	Bubble.prototype.removeImmediately = function () {
		SimpleGame.myGame.time.events.remove(this.timerEvent);
		this.imgSprite.destroy(true);
		Bubble.bubbleArr.splice(Bubble.bubbleArr.indexOf(this), 1);
	};
	Bubble.prototype.remove = function () {
		if (this.isBeingRemoved || SimpleGame.gameOverStartedFlag)
			return;
		this.isBeingRemoved = true;
		MainUI.myRef.score += this.score;
		this.score = 0;
		// console.log(this.imgSprite, this.myState, this);
		SimpleGame.myGame.time.events.remove(this.timerEvent);
		// SimpleGame.myGame.time.events.add(1800, this.destroy, this)
		var frameNameArr = new Array();
		var i = 5;
		while (i-- > 1) {
			frameNameArr[i - 1] = "" + Bubble.frameNameArrPrefix[this.myIdx] + i;
		}
		this.animExplosion = new FrameSequence(frameNameArr, this.imgSprite.x, this.imgSprite.y, 40);
		this.animExplosion.removeOnCompleteFlag = true;
		this.animExplosion.callOnRemove = this.destroy;
		this.imgSprite.destroy(true);
		if (!SimpleGame.myGame.device.ie) {
			SoundManager._sbang.allowMultiple = true;
			SoundManager._sbang.play();
			SoundManager._sbang.volume = 0.3;
		}
		Bubble.bubbleArr.splice(Bubble.bubbleArr.indexOf(this), 1);
	};
	Bubble.prototype.removeEndGameAnim = function () {
		if (this.isBeingRemoved)
			return;
		this.isBeingRemoved = true;
		// console.log(this.imgSprite, this.myState, this);
		SimpleGame.myGame.time.events.remove(this.timerEvent);
		// SimpleGame.myGame.time.events.add(1800, this.destroy, this)
		var frameNameArr = new Array();
		var i = 5;
		while (i-- > 1) {
			frameNameArr[i - 1] = "" + Bubble.frameNameArrPrefix[this.myIdx] + i;
		}
		this.animExplosion = new FrameSequence(frameNameArr, this.imgSprite.x, this.imgSprite.y, 40);
		this.animExplosion.removeOnCompleteFlag = true;
		this.animExplosion.callOnRemove = this.destroy;
		this.imgSprite.destroy(true);
		Bubble.bubbleArr.splice(Bubble.bubbleArr.indexOf(this), 1);
	};
	Bubble.prototype.destroy = function () {
		// this.animExplosion.remove();
	};
	Bubble.getReadyToLaunchBubble = function () {
		var i = Bubble.bubbleArr.length;
		while (i-- > 0) {
			// console.log(Bubble.bubbleArr[i].myState, Bubble.bubbleArr[i].imgSprite.y)
			if (Bubble.bubbleArr[i].myState == Bubble.STATE_READY_TO_LAUNCH) {
				return Bubble.bubbleArr[i];
			}
		}
		return null;
	};
	Bubble.prototype.onUpdate = function (dt) {
		if (this.myState == Bubble.STATE_IN_QUEUE) {
			this.imgSprite.x = GameConsts.WIDTH * 0.05;
			this.imgSprite.y = GameConsts.HEIGHT * 0.92;
			Bubble.queueBubble = this;
		}
		else if (this.myState == Bubble.STATE_DEFAULT || this.myState == Bubble.STATE_READY_TO_LAUNCH) {
			if (this.myState == Bubble.STATE_READY_TO_LAUNCH) {
				//console.log("ready to launch");
				//console.log(imgSprite.x._, imgSprite.y._);
				//imgSprite.setXY(GameConsts.WIDTH * 0.5, GameConsts.HEIGHT * 0.95);
				this.setToMyRealCoord();
			}
			this.imgSprite.x = this.defaultRealX + this.deltaRealX;
			this.imgSprite.y = this.defaultRealY + this.deltaRealY;
			this.deltaRealX *= 0.87;
			this.deltaRealY *= 0.87;
			if (this.myState == Bubble.STATE_DEFAULT) {
				if (this.boardCoordY > 12) {
				}
				if (this.boardCoordY > 14 && this.imgSprite.y > 470 && this.isBeingRemoved == false) {
					SimpleGame.gameOverStarted();
				}
			}
		}
		else if (this.myState == Bubble.STATE_LAUNCHED) {
			this.imgSprite.x += this.vx;
			this.imgSprite.y += this.vy;
			if (this.imgSprite.x > GameConsts.RIGHT_BOARD_BORDER) {
				this.vx *= -1;
				this.imgSprite.x = GameConsts.RIGHT_BOARD_BORDER;
			}
			else if (this.imgSprite.x < GameConsts.LEFT_BOARD_BORDER) {
				this.vx *= -1;
				this.imgSprite.x = GameConsts.LEFT_BOARD_BORDER;
			}
			if (BoardManager.checkIfArrivedToPosition(this)) {
				this.defaultRealX = this.imgSprite.x - .05 * this.vx;
				this.defaultRealY = this.imgSprite.y - .05 * this.vy;
				BoardManager.assignStateDefaultCoords(this);
				var realCoords = BoardManager.boardCoordToRealCoord(this.boardCoordX, this.boardCoordY);
				this.defaultRealX = realCoords.x;
				this.defaultRealY = realCoords.y;
				this.imgSprite.x += 0.5 * (this.defaultRealX - this.imgSprite.x);
				this.imgSprite.y += 0.5 * (this.defaultRealY - this.imgSprite.y);
				this.myState = Bubble.STATE_DEFAULT;
				if (BoardManager.bubbleArrived(this)) {
					//Bubbles are removed
					SimpleGame.myGame.time.events.add(BoardManager.timeToNewBubble, BoardManager.addNewBubblePreStep);
					this.setToMyRealCoord(true);
				}
				else {
					//No removal
					SimpleGame.myGame.time.events.add(0.2, BoardManager.addNewBubble);
					SoundManager._sconnect.play();
					this.arrivedTween();
					this.setToMyRealCoord(false);
				}
				// shockTween(this.defaultRealX, this.defaultRealY);
			}
		}
		// super.onUpdate(dt);
	};
	Bubble.prototype.arrivedTween = function () {
		SimpleGame.myGame.time.events.add(100, this.arrivedTweenStart, this);
		SimpleGame.myGame.add.tween(this.imgSprite.scale).to({ x: 0.8, y: 0.8 }, 50, Phaser.Easing.Linear.None, true, 0);
	};
	Bubble.prototype.arrivedTweenStart = function () {
		this.imgSprite.scale.x = 1;
		this.imgSprite.scale.y = 1;
		SimpleGame.myGame.add.tween(this.imgSprite.scale).from({ x: 0.8, y: 0.8 }, 150, Phaser.Easing.Linear.None, true, 0);
	};
	Bubble.STATE_DEFAULT = 0;
	Bubble.STATE_LAUNCHED = 1;
	Bubble.STATE_READY_TO_LAUNCH = 2;
	Bubble.STATE_IN_QUEUE = 3;
	Bubble.bubbleImgNameArr = ["bubble_blue", "bubble_red", "bubble_green", "bubble_yellow", "bubble_purple", "bubble_lightblue"];
	Bubble.frameNameArrPrefix = ["ani_blue_", "ani_red_", "ani_green_", "ani_yellow_", "ani_purple_", "ani_lightblue_"];
	return Bubble;
}());
var Cannon = /** @class */ (function () {
	function Cannon() {
		this.gameCannon = SimpleGame.myGame.add.sprite(0, 0, 'canon');
		// this.gameCannon.disablePointer();
		// console.log(this.gameCannon.width, this.gameCannon.height);
		this.gameCannon.anchor.set(this.gameCannon.width * 0.5, this.gameCannon.height);
		this.gameCannon.anchor.set(0.5, 1);
		this.gameCannon.x = GameConsts.WIDTH * 0.37;
		this.gameCannon.y = GameConsts.HEIGHT * .92;
		this.gameCannon.smoothed = true;
		// console.log("add cannon");
		SimpleGame.myGame.time.events.loop(10, this.onUpdate, this);
		this.clickableArea = SimpleGame.myGame.add.graphics(25, 25);
		this.clickableArea.beginFill(0xffffff);
		this.clickableArea.drawRect(0, 0, 560, 480);
		this.clickableArea.endFill();
		this.clickableArea.alpha = 0.1;
		this.clickableArea.inputEnabled = true;
		// EDITED: onInputDown -> onInputUp
		this.clickableArea.events.onInputUp.add(this.cannonFired, this);
	}
	Cannon.prototype.cannonFired = function () {
		if (Cannon.addNewRowInProgress) {
			return;
		}
		if (SimpleGame.promptActive) {
			return;
		}
		if (Cannon.cannonEnabled == false) {
			return;
		}
		// console.log("clicked on uibg... ");
		var mouseX = SimpleGame.myGame.input.x;
		var mouseY = SimpleGame.myGame.input.y;
		//Bubble.shockTween(e.viewX, e.viewY);
		var bubble = Bubble.getReadyToLaunchBubble();
		// console.log("buble: " + bubble);
		if (bubble == null)
			return;
		var imgSprite = bubble.imgSprite;
		// var xCorrected:number = (e.viewX - Main.borderE.width._  - 0.5* bubble.imgSprite.getNaturalWidth()) / GameConsts.scale;
		// trace("xCorrected: " + xCorrected);
		var deltaX = imgSprite.x - mouseX;
		var deltaY = imgSprite.y - mouseY;
		var angle = 180 / Math.PI * Math.atan2(deltaY, deltaX) - 90;
		var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		if (angle < -180 || angle > 75) {
			angle = 75;
		}
		else if (angle < -75) {
			angle = -75;
		}
		bubble.launch(angle, distance);
	};
	Cannon.prototype.onUpdate = function () {
		var mouseX = SimpleGame.myGame.input.x;
		var mouseY = SimpleGame.myGame.input.y;
		// var xCorrected:number = (mouseX - 50) / GameConsts.scale;
		var xCorrected = mouseX;
		var deltaX = this.gameCannon.x - xCorrected;
		var deltaY = this.gameCannon.y - mouseY;
		var angle = 180 / Math.PI * Math.atan2(deltaY, deltaX) - 90;
		var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		// if (GameContext.gameOverStartedFlag == false)
		// {
		// 	this.gameCannon.setRotation(angle);
		// }
		if (angle < -180 || angle > 75) {
			angle = 75;
		}
		else if (angle < -75) {
			angle = -75;
		}
		this.gameCannon.angle = angle;
		// console.log(this.gameCannon.x, this.gameCannon.y, angle)
	};
	Cannon.cannonEnabled = false;
	Cannon.addNewRowInProgress = false;
	return Cannon;
}());
var LivesUI = /** @class */ (function () {
	function LivesUI() {
		this.livesLeft = 5;
		this.maxLivesLeft = 5;
		this.deltaX = 10;
		LivesUI.myRef = this;
		this.bubbleArr = new Array();
		var i = 6;
		while (i-- > 0) {
			var bubble = SimpleGame.myGame.add.sprite(0, 0, "levels_ball_empty");
			this.bubbleArr[i] = bubble;
			bubble.anchor.set(0.5, 0.5);
			if (i > 0) {
				bubble.x = 15 + (bubble.width + this.deltaX) * (i) + this.deltaX + 6 + bubble.width / 2;
			}
			else {
				bubble.x = 15 + this.deltaX + bubble.width / 2;
			}
			bubble.y = 537 + bubble.height / 2;
			// console.log("added bubble: ", bubble.x, bubble.y);
		}
		LivesUI.myRef = this;
		SimpleGame.myGame.time.events.loop(20, this.onUpdate, this);
	}
	LivesUI.loseLife = function () {
		if (LivesUI.myRef != null) {
			LivesUI.myRef.loseOneLife();
		}
	};
	LivesUI.resetMaxLives = function () {
		return BoardManager.totalColors - 1;
	};
	LivesUI.resetLives = function () {
		LivesUI.myRef.maxLivesLeft--;
		if (LivesUI.myRef.maxLivesLeft <= 0) {
			LivesUI.myRef.maxLivesLeft = LivesUI.resetMaxLives();
		}
		if (LivesUI.myRef.maxLivesLeft > LivesUI.resetMaxLives()) {
			LivesUI.myRef.maxLivesLeft = LivesUI.resetMaxLives();
		}
		LivesUI.myRef.livesLeft = LivesUI.myRef.maxLivesLeft;
	};
	LivesUI.prototype.loseOneLife = function () {
		if (this.livesLeft > 0) {
			this.livesLeft--;
		}
		else {
			// EntityHelper.delayedCall(0.1, BoardManager.addNewRow);
			Cannon.addNewRowInProgress = true;
			SimpleGame.myGame.time.events.add(100, BoardManager.addNewRow);
		}
		// console.log("life lost, lives left: " + this.livesLeft);
	};
	LivesUI.prototype.gainLife = function () {
		LivesUI.myRef.maxLivesLeft = LivesUI.resetMaxLives();
		LivesUI.myRef.livesLeft = LivesUI.myRef.maxLivesLeft;
	};
	LivesUI.prototype.onUpdate = function (dt) {
		if (dt === void 0) { dt = null; }
		var x = this.livesLeft;
		// console.log("lives left: " + x)
		var i = this.bubbleArr.length;
		while (i-- > 0) {
			if (i <= x) {
				this.bubbleArr[i].alpha = 1;
				this.bubbleArr[i].scale.set(1, 1);
			}
			else {
				// this.bubbleArr[i].alpha = 0.001;
				if (this.bubbleArr[i].alpha > 0) {
					this.bubbleArr[i].alpha *= 0.87;
					this.bubbleArr[i].scale.set(this.bubbleArr[i].alpha, this.bubbleArr[i].alpha);
				}
			}
		}
		// super.onUpdate(dt);
	};
	return LivesUI;
}());
var MainUI = /** @class */ (function () {
	function MainUI() {
		this.score = 0;
		MainUI.myRef = this;
		var helpbutton = new ButtonWithTween(SimpleGame.myGame.add.group(), 'btn_help', 738, 69, function () {
			if (!SimpleGame.promptActive) {
				var helpprompt = new HelpPrompt();
				SoundManager._sdown.play();
			}
		});
		var moregames = new ButtonWithTween(SimpleGame.myGame.add.group(), 'btn_moregames', 752, 144, function () {
			if (!SimpleGame.promptActive) {
			}
		});
		var sound = new ButtonWithTween(SimpleGame.myGame.add.group(), 'btn_sound', 689, 120, function () {
			if (!SimpleGame.promptActive) {
				if (SoundManager.muteFlag == true) {
					SoundManager._sdown.play();
				}
				SoundManager.setMuteFlags(!SoundManager.muteFlag);
				SoundManager.muteFlag = !SoundManager.muteFlag;
			}
		});
		var restart = new ButtonWithTween(SimpleGame.myGame.add.group(), 'btn_restart', 632, 79, function () {
			if (!SimpleGame.promptActive) {
				MainUI.myRef.reset();
				BoardManager.resetBoard();
				SoundManager._sdown.play();
			}
		});
		var topten = new ButtonWithTween(SimpleGame.myGame.add.group(), 'btn_top10', 641, 168, function () {
			if (!SimpleGame.promptActive) {
				var topten = new TopTenPrompt();
			}
		});
		SimpleGame.myGame.time.events.loop(5, this.update, this);
		var scoregroup = SimpleGame.myGame.add.group();
		this.scoreDigitArr = new Array();
		var i = 7;
		while (i-- > 0) {
			var scoredigit = new ScoreDigit(scoregroup, 624 + 27 * (i - 1), 212);
			this.scoreDigitArr[i] = scoredigit;
		}
		SimpleGame.myGame.add.sprite(615, 252, 'novice');
		SimpleGame.myGame.time.events.loop(1000, this.gameWonCheck, this);
	}
	MainUI.prototype.reset = function () {
		this.score = 0;
	};
	MainUI.prototype.gameWonCheck = function () {
		if (this.checkIfGameWon() && SimpleGame.gameOverStartedFlag == false) {
			SimpleGame.gameOverStartedFlag = true;
			var g = new GameOver(MainUI.myRef.score, true);
		}
	};
	MainUI.prototype.update = function () {
		this.manageScore();
	};
	MainUI.prototype.checkIfGameWon = function () {
		var i = Bubble.bubbleArr.length;
		var numBubbles = 0;
		while (i-- > 0) {
			var b = Bubble.bubbleArr[i];
			if (b.myState == Bubble.STATE_DEFAULT) {
				numBubbles++;
			}
		}
		if (numBubbles > 0) {
			return false;
		}
		else {
			return true;
		}
	};
	MainUI.prototype.manageScore = function () {
		var str = this.score.toString();
		var delta = 7 - str.length;
		var i = str.length;
		while (i-- > 0) {
			this.scoreDigitArr[i + delta].setToNumber(parseInt(this.score.toString()[i]));
		}
		i = delta;
		while (i-- > 0) {
			this.scoreDigitArr[i].makeInvisible();
		}
	};
	return MainUI;
}());
var ScoreDigit = /** @class */ (function () {
	function ScoreDigit(parent, x, y) {
		this.digitArray = new Array();
		var i = 10;
		while (i-- > 0) {
			this.digitArray[i] = SimpleGame.myGame.make.sprite(x, y, 'score_digit_' + i);
			parent.add(this.digitArray[i]);
		}
	}
	ScoreDigit.prototype.makeInvisible = function () {
		var i = 10;
		while (i-- > 0) {
			this.digitArray[i].visible = false;
		}
	};
	ScoreDigit.prototype.setToNumber = function (x) {
		// console.log("set to number: " + x);
		var i = 10;
		while (i-- > 0) {
			this.digitArray[i].visible = false;
		}
		if (x >= 0 && x <= 9)
			this.digitArray[x].visible = true;
	};
	return ScoreDigit;
}());
var ScoreDigitArray = /** @class */ (function () {
	function ScoreDigitArray(mygroup, x, y) {
		this.scoreDigitArr = new Array();
		var i = 7;
		while (i-- > 0) {
			var scoredigit = new ScoreDigit(mygroup, x + 27 * (i - 1), y);
			this.scoreDigitArr[i] = scoredigit;
		}
	}
	ScoreDigitArray.prototype.setToNumber = function (score) {
		var str = score.toString();
		var delta = 7 - str.length;
		var i = str.length;
		while (i-- > 0) {
			this.scoreDigitArr[i + delta].setToNumber(parseInt(score.toString()[i]));
		}
		i = delta;
		while (i-- > 0) {
			this.scoreDigitArr[i].makeInvisible();
		}
	};
	return ScoreDigitArray;
}());
var TopTen = /** @class */ (function () {
	function TopTen(name, score) {
		this.name = name;
		this.score = score;
	}
	TopTen.addTopTen = function (name, score) {
		var unsortedArray = this.getTopTenUnsorted();
		var idx = -100;
		if (unsortedArray.length >= 10) {
			var lowestScore = this.getLowestScore();
			if (lowestScore != null) {
				if (lowestScore.score > score)
					return;
			}
			idx = unsortedArray.indexOf(lowestScore);
			idx = this.getIndexOfTopTen(lowestScore, unsortedArray);
		}
		else {
			idx = unsortedArray.length;
		}
		Util.setStorage("score_" + idx, score);
		Util.setStringStorage("names_" + idx, name);
	};
	TopTen.getIndexOfTopTen = function (topten, array) {
		var i = array.length;
		while (i-- > 0) {
			var tt = array[i];
			if (topten.name == tt.name && topten.score == tt.score) {
				return i;
			}
		}
		return -1;
	};
	TopTen.getLowestScore = function () {
		if (this.getTopTenSorted()[9] != null) {
			return this.getTopTenSorted()[9];
		}
		else {
			return null;
		}
	};
	TopTen.getTopTenUnsorted = function () {
		var scoreArrUnsorted = new Array();
		var i = 10;
		while (i-- > 0) {
			var score = Util.getStorage("score_" + i, -1);
			var name = Util.getStringStorage("names_" + i, "");
			if (score > 0) {
				var topten = new TopTen(name, score);
				scoreArrUnsorted[i] = topten;
			}
		}
		return scoreArrUnsorted;
	};
	TopTen.getTopTenSorted = function () {
		var scoreArrUnsorted = this.getTopTenUnsorted();
		scoreArrUnsorted.sort(function (a, b) {
			return b.score - a.score;
		});
		return scoreArrUnsorted;
	};
	return TopTen;
}());
var AddScore = /** @class */ (function () {
	function AddScore(score, addTopTenScreenAfterThis) {
		if (addTopTenScreenAfterThis === void 0) { addTopTenScreenAfterThis = false; }
		this.showCursor = false;
		this.lastStringEntered = "";
		SoundManager._sdown.play();
		this.score = score;
		this.addTopTenScreenAfterThis = addTopTenScreenAfterThis;
		this.inputTxtString = this.lastStringEntered;
		// console.log("add keyboard callback");
		SimpleGame.myGame.input.keyboard.addCallbacks(SimpleGame.myGame, this.mykeydownhandler.bind(this));
		this.mySpr = SimpleGame.myGame.add.sprite(0, 0, 'prompt_enter-name');
		this.mySpr.anchor.set(0.5, 0.5);
		this.mySpr.x = GameConsts.WIDTH / 2;
		this.mySpr.y = GameConsts.HEIGHT / 2;
		SimpleGame.promptActive = true;
		this.okbut = new ButtonWithTween(SimpleGame.myGame.add.group(), 'prompt_button_ok', 395 + 30, 328, this.okpressed.bind(this));
		this.cancelbut = new ButtonWithTween(SimpleGame.myGame.add.group(), 'prompt_button_cancel', 395 - 30, 328, this.cancelpressed.bind(this));
		this.inputTxt = SimpleGame.myGame.add.text(264, 275, "", {
			font: "17px Arial", fill: "#0000ff", fontWeight: "700", align: 'left'
		});
		this.cursorLoop = SimpleGame.myGame.time.events.loop(500, this.manageCursor, this);
	}
	AddScore.prototype.okpressed = function () {
		var finalTxt = "Anonymous";
		if (this.inputTxtString != "") {
			finalTxt = this.inputTxtString;
		}
		TopTen.addTopTen("" + finalTxt, this.score);
		this.remove();
	};
	AddScore.prototype.cancelpressed = function () {
		parent.location.reload();
		//this.remove();
	};
	AddScore.prototype.manageCursor = function () {
		this.showCursor = !this.showCursor;
		this.addCursorIfNeeded();
	};
	AddScore.prototype.addCursorIfNeeded = function () {
		if (this.showCursor) {
			this.inputTxt.text = this.inputTxtString + '|';
		}
		else {
			this.inputTxt.text = this.inputTxtString;
		}
	};
	AddScore.prototype.mykeydownhandler = function (evt) {
		// Skip it unless it's a-z.
		if (evt.which >= "A".charCodeAt(0) && evt.which <= "Z".charCodeAt(0)) {
			var letter = String.fromCharCode(evt.which);
			this.addLetter(letter, evt);
		}
		else if (evt.which >= "a".charCodeAt(0) && evt.which <= "z".charCodeAt(0)) {
			var letter = String.fromCharCode(evt.which);
			this.addLetter(letter, evt);
		}
		else if (evt.which >= "0".charCodeAt(0) && evt.which <= "9".charCodeAt(0) || evt.which == " ".charCodeAt(0)) {
			var letter = String.fromCharCode(evt.which);
			this.addLetter(letter, evt);
		}
		else if (evt.which == 8) {
			this.removeLetter();
		}
		else {
			return;
		}
	};
	AddScore.prototype.removeLetter = function () {
		// this.inputTxtString = ""
		this.inputTxtString = this.inputTxtString.slice(0, this.inputTxtString.length - 1);
		this.addCursorIfNeeded();
	};
	AddScore.prototype.addLetter = function (letter, evt) {
		if (!evt.shiftKey)
			letter = letter.toLowerCase();
		if (this.inputTxtString.length < 18)
			this.inputTxtString += letter;
		this.addCursorIfNeeded();
	};
	AddScore.prototype.remove = function () {
		SimpleGame.myGame.input.keyboard.reset(true);
		SimpleGame.myGame.time.events.remove(this.cursorLoop);
		this.mySpr.destroy();
		this.okbut.remove();
		this.cancelbut.remove();
		this.inputTxt.destroy();
		SimpleGame.promptActive = true;
		if (this.addTopTenScreenAfterThis) {
			var topten = new TopTenPrompt(true);
		}
		else {
			SimpleGame.myGame.time.events.add(200, function () {
				SimpleGame.promptActive = false;
			});
		}
	};
	return AddScore;
}());
var GameOver = /** @class */ (function () {
	function GameOver(score, gameWon) {
		SoundManager._sgo.play();
		this.mygroup = SimpleGame.myGame.add.group();
		this.score = score;
		this.mySpr = SimpleGame.myGame.add.sprite(0, 0, 'prompt_game_over');
		this.mySpr.anchor.set(0.5, 0.5);
		this.mySpr.x = GameConsts.WIDTH / 2 - 30;
		this.mySpr.y = GameConsts.HEIGHT / 2 - 50;
		this.mygroup.add(this.mySpr);
		SimpleGame.promptActive = true;
		this.scoreDigits = new ScoreDigitArray(this.mygroup, 330, 180);
		this.scoreDigits.setToNumber(score);
		var bonus = 0;
		if (gameWon) {
			bonus = score;
		}
		this.bonusDigits = new ScoreDigitArray(this.mygroup, 330, 220);
		this.bonusDigits.setToNumber(bonus);
		this.totalDigits = new ScoreDigitArray(this.mygroup, 330, 265);
		this.totalDigits.setToNumber(bonus + score);
		this.okbut = new ButtonWithTween(this.mygroup, 'prompt_button_ok', 365, 320, this.remove.bind(this));
		this.timerEvent = SimpleGame.myGame.time.events.loop(100, this.startAnim, this);
		this.score = bonus + score;
	}
	GameOver.prototype.startAnim = function () {
		// console.log("start anim");
		var i = Bubble.bubbleArr.length;
		if (i > 0) {
			var b = Bubble.bubbleArr[Math.floor(i * Math.random())];
			if (b.myState == Bubble.STATE_DEFAULT) {
				b.removeEndGameAnim();
			}
		}
		SimpleGame.myGame.world.bringToTop(this.mygroup);
	};
	GameOver.prototype.remove = function () {
		SimpleGame.myGame.time.events.remove(this.timerEvent);
		this.mygroup.destroy(true);
		if (this.score > 0) {
			openHighscoreForm(this.score, document.highscoreHash);
		} else {
			// console.log("reset game");
			MainUI.myRef.reset();
			BoardManager.resetBoard();
			SoundManager._sdown.play();
			SimpleGame.myGame.time.events.add(20, function () {
				SimpleGame.promptActive = false;
			});
		}
	};
	return GameOver;
}());
var HelpPrompt = /** @class */ (function () {
	// overlay:Phaser.Graphics;
	function HelpPrompt() {
		// console.log("add help");
		this.mySpr = SimpleGame.myGame.add.sprite(0, 0, 'prompt_help');
		this.mySpr.anchor.set(0.5, 0.5);
		this.mySpr.x = GameConsts.WIDTH / 2;
		this.mySpr.y = GameConsts.HEIGHT / 2;
		SimpleGame.promptActive = true;
		this.okbut = new ButtonWithTween(SimpleGame.myGame.add.group(), 'prompt_button_ok', 395, 498, this.remove.bind(this));
	}
	HelpPrompt.prototype.remove = function () {
		SimpleGame.myGame.time.events.add(20, function () {
			SimpleGame.promptActive = false;
		});
		this.mySpr.destroy();
		this.okbut.remove();
		SoundManager._sdown.play();
	};
	return HelpPrompt;
}());
var TopTenPrompt = /** @class */ (function () {
	function TopTenPrompt(resetGame) {
		if (resetGame === void 0) { resetGame = false; }
		SoundManager._sdown.play();
		this.resetGame = resetGame;
		// console.log("add top ten");
		this.mySpr = SimpleGame.myGame.add.sprite(0, 0, 'prompt_top10');
		this.mySpr.anchor.set(0.5, 0.5);
		this.mySpr.x = GameConsts.WIDTH / 2;
		this.mySpr.y = GameConsts.HEIGHT / 2;
		SimpleGame.promptActive = true;
		this.okbut = new ButtonWithTween(SimpleGame.myGame.add.group(), 'prompt_button_ok', 395, 432, this.remove.bind(this));
		this.leftTxt = SimpleGame.myGame.add.text(264, 165, "", {
			font: "17px Arial", fill: "#60606d", fontWeight: "700", align: 'left'
		});
		this.leftTxt.anchor.set(0, 0);
		this.leftTxt.lineSpacing -= 1;
		this.rightTxt = SimpleGame.myGame.add.text(525, 165, "10\n20\n30", {
			font: "17px Arial", fill: "#60606d", fontWeight: "700", align: 'right'
		});
		this.rightTxt.anchor.set(1, 0);
		this.rightTxt.lineSpacing -= 1;
		// var addscore:AddScore = new AddScore();
		// TopTen.addTopTen("player_" + Math.floor( 100*Math.random()),100*Math.random())
		// TopTen.addTopTen()
		this.leftTxt.text = this.rightTxt.text = "";
		var toptenArr = TopTen.getTopTenSorted();
		var i = -1;
		while (++i < toptenArr.length) {
			var name = toptenArr[i].name;
			var score = toptenArr[i].score;
			this.leftTxt.text += "" + name + "\n";
			this.rightTxt.text += "" + score + "\n";
		}
	}
	TopTenPrompt.prototype.remove = function () {
		SimpleGame.myGame.time.events.add(20, function () {
			SimpleGame.promptActive = false;
		});
		this.mySpr.destroy();
		this.okbut.remove();
		this.leftTxt.destroy();
		this.rightTxt.destroy();
		SoundManager._sdown.play();
		if (this.resetGame) {
			parent.location.reload();
//            MainUI.myRef.reset();
//            BoardManager.resetBoard();
		}
	};
	return TopTenPrompt;
}());
var ButtonTextOnly = /** @class */ (function () {
	function ButtonTextOnly(parent, x, y, width, height, normalStateGroup, overStateGroup, onClickFunction) {
		if (onClickFunction === void 0) { onClickFunction = function () {
		}; }
		this.parent = parent;
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.normalStateGroup = normalStateGroup;
		this.overStateGroup = overStateGroup;
		this.onClickFunction = onClickFunction;
		this.normalStateGroup.x = x;
		this.normalStateGroup.y = y;
		this.overStateGroup.x = x;
		this.overStateGroup.y = y;
		this.buttonBody = SimpleGame.myGame.make.graphics(0, 0);
		this.buttonBody.beginFill(0xffffff);
		this.buttonBody.drawRect(0, 0, width, height);
		this.buttonBody.endFill();
		this.buttonBody.alpha = 0.0000000000001;
		this.buttonBody.inputEnabled = true;
		this.buttonBody.x = x - 15;
		this.buttonBody.y = y;
		this.buttonBody.events.onInputUp.add(this.onButtonClicked, this);
		this.buttonBody.events.onInputOver.add(this.onButtonOver, this);
		this.buttonBody.events.onInputOut.add(this.onButtonOut, this);
		this.buttonBody.input.useHandCursor = true;
		parent.add(this.buttonBody);
		parent.add(normalStateGroup);
		parent.add(overStateGroup);
		this.onButtonOut();
	}
	ButtonTextOnly.prototype.onButtonClicked = function () {
		this.onClickFunction();
	};
	ButtonTextOnly.prototype.onButtonOver = function () {
		this.normalStateGroup.visible = false;
		this.overStateGroup.visible = true;
	};
	ButtonTextOnly.prototype.onButtonOut = function () {
		this.normalStateGroup.visible = true;
		this.overStateGroup.visible = false;
	};
	return ButtonTextOnly;
}());
var ButtonWithOverState = /** @class */ (function () {
	function ButtonWithOverState(parent, imgNormalName, imgOverName, x, y, onClickFunction) {
		if (onClickFunction === void 0) { onClickFunction = function () {
		}; }
		this.onClickExecuted = false;
		this.skipClickSound = false;
		this.skipMouseOver = false;
		this.imgnormalnamestr = imgNormalName;
		this.parent = parent;
		this.imgNormalName = imgNormalName;
		this.imgOverName = imgOverName;
		this.x = x;
		this.y = y;
		this.imgNormal = SimpleGame.myGame.make.sprite(this.x, this.y, imgNormalName);
		this.imgOver = SimpleGame.myGame.make.sprite(this.x, this.y, imgOverName);
		parent.add(this.imgNormal);
		parent.add(this.imgOver);
		this.imgNormal.inputEnabled = this.imgOver.inputEnabled = false;
		this.imgOver.inputEnabled = false;
		this.imgNormal.events.onInputOver.add(this.onButtonOver, this, 0);
		// this.imgOver.events.onInputOver.add(this.onButtonOver, this, 0)
		this.imgNormal.events.onInputUp.add(this.banInput, this, 100);
		this.imgNormal.events.onInputDown.add(this.onButtonClicked, this, 2);
		this.imgNormal.events.onInputOut.add(this.onButtonOut, this, 1);
		this.imgOver.events.onInputOut.add(this.onButtonOut, this, 1);
		// this.imgOver.events.onInputDown.add(this.onButtonClicked, this,3)
		this.imgOver.events.onInputUp.add(this.onButtonOut, this, 4);
		this.imgNormal.events.onInputUp.add(this.teste, this, 4);
		this.onClickFunction = onClickFunction;
		this.imgOver.visible = false;
		this.loopEvent = SimpleGame.myGame.time.events.loop(100, this.update, this);
		this.loopEvent1 = SimpleGame.myGame.time.events.loop(10, this.update1, this);
		// console.log("button created");
		// this.imgNormal.input.useHandCursor = true;
		this.delayEvent = SimpleGame.myGame.time.events.add(150, function () {
			this.imgNormal.inputEnabled = true;
			this.imgNormal.input.useHandCursor = true;
			// if (GameUI.promptLayer != null)
			// {
			//     if (GameUI.promptLayer.countLiving() <= 0)
			//     {
			//         this.imgNormal.input.useHandCursor = true;
			//     }
			//     else
			//     {
			//         this.imgNormal.input.useHandCursor = true;
			//     }
			// }
			// else
			// {
			//     this.imgNormal.input.useHandCursor = true;
			// }
			// console.log("input enabled");
		}, this);
	}
	ButtonWithOverState.prototype.teste = function () {
		// console.log("TESTE");
	};
	ButtonWithOverState.prototype.update = function () {
		//   console.log("update button: " + this.onClickExecuted)
		if (this.imgNormal.input != null) {
			if (this.skipMouseOver) {
				// console.log("remove hand cursor");
				this.imgNormal.input.useHandCursor = false;
				this.imgOver.visible = false;
			}
			else {
				// this.imgNormal.input.useHandCursor = true;
			}
		}
		if (this.imgOver.parent) {
			if (!this.imgOver.getBounds().contains(SimpleGame.myGame.input.x, SimpleGame.myGame.input.y)) {
				this.onButtonOut();
			}
			else {
				if (this.imgnormalnamestr == "open_menu2") {
					this.imgNormal.input.useHandCursor = true;
					this.onButtonOver();
				}
			}
		}
		else {
			SimpleGame.myGame.time.events.remove(this.loopEvent);
		}
		this.setXY(this.x, this.y);
	};
	ButtonWithOverState.prototype.update1 = function () {
		//   console.log("update button: " + this.onClickExecuted)
		this.setXY(this.x, this.y);
	};
	ButtonWithOverState.prototype.banInput = function () {
		// this.onClickExecuted = true;
		// console.log("button click success")
		// SimpleGame.myGame.time.events.add(150, function()
		// {
		//      console.log("can click button")
		//     this.onClickExecuted = false;
		// }, this)
	};
	ButtonWithOverState.prototype.onButtonOver = function () {
		// console.log("button over");
		if (this.skipMouseOver) {
			this.imgNormal.input.useHandCursor = false;
			return;
		}
		this.imgOver.visible = true;
		SimpleGame.myGame.canvas.style.cursor = "pointer";
		if (SimpleGame.myGame.device.touch) {
			this.imgOver.visible = false;
		}
	};
	ButtonWithOverState.prototype.onButtonOut = function () {
		if (this.imgnormalnamestr == "open_menu2") {
			// console.log("button out");
		}
		this.imgOver.visible = false;
		// this.imgNormal.input.useHandCursor = false;
	};
	ButtonWithOverState.prototype.onButtonClicked = function (evt) {
		// console.log("button click attempt registered");
		//  var delay = Consts.DELAY_BETWEEN_EVENTS_DESKTOP;
		//  if (SimpleGame.myGame.device.touch)
		//  {
		//     delay = Consts.DELAY_BETWEEN_EVENTS_TOUCH;
		//  }
		if (this.onClickExecuted == false || true) {
			// console.log("execute click");
			this.onClickExecuted = true;
			// console.log("button click success")
			SimpleGame.myGame.time.events.add(80, function () {
				// console.log("can click button");
				this.onClickExecuted = false;
			}, this);
			this.onClickFunction();
			SimpleGame.myGame.input.reset();
			//  if (this.skipClickSound == false)
			//  SoundManager.playClick();
		}
		else {
			//  console.log("cannot click button")
		}
		// if (SimpleGame.myGame.device.android || SimpleGame.myGame.device.iOS)
		// {
		//     SimpleGame.myGame.input.enabled = false;
		//     SimpleGame.myGame.time.events.add(120, function()
		//     {
		//         SimpleGame.myGame.input.enabled = true;
		//         SimpleGame.myGame.input.reset()
		//     })
		// }
	};
	ButtonWithOverState.prototype.setXY = function (x, y) {
		this.imgNormal.x = x;
		this.imgOver.x = x;
		this.x = x;
		this.imgNormal.y = y;
		this.imgOver.y = y;
		this.y = y;
	};
	ButtonWithOverState.prototype.setVisible = function () {
		// console.log("set visible");
		this.parent.add(this.imgNormal);
		this.parent.add(this.imgOver);
	};
	ButtonWithOverState.prototype.setInvisible = function () {
		this.parent.remove(this.imgNormal);
		this.parent.remove(this.imgOver);
	};
	return ButtonWithOverState;
}());
var ButtonWithOverAndText = /** @class */ (function (_super) {
	__extends(ButtonWithOverAndText, _super);
	function ButtonWithOverAndText(text, parent, imgNormalName, imgOverName, x, y, onClickFunction) {
		if (onClickFunction === void 0) { onClickFunction = function () {
		}; }
		var _this = _super.call(this, parent, imgNormalName, imgOverName, x, y, onClickFunction) || this;
		_this.fixedTxtCoords = false;
		_this.fixedTxtX = 0;
		_this.fixedTxtY = 0;
		_this.text = text;
		// this.text.inputEnabled = false;
		// this.text.interactive = false;
		// this.text.input.useHandCursor = true;
		parent.add(text);
		return _this;
	}
	ButtonWithOverAndText.prototype.setXY = function (x, y) {
		_super.prototype.setXY.call(this, x, y);
		if (this.fixedTxtCoords) {
			this.text.x = this.imgNormal.x + this.fixedTxtX;
			this.text.y = this.imgNormal.y + this.fixedTxtY + 1;
		}
		else {
			this.text.x = this.imgNormal.x + 0.5 * (this.imgNormal.width - this.text.width);
			this.text.y = this.imgNormal.y + 0.5 * (this.imgNormal.height - 0.85 * this.text.height) + 2;
		}
	};
	ButtonWithOverAndText.prototype.setVisible = function () {
		// console.log("set visible");
		this.parent.add(this.imgNormal);
		this.parent.add(this.imgOver);
		this.parent.add(this.text);
	};
	ButtonWithOverAndText.prototype.setInvisible = function () {
		this.parent.remove(this.imgNormal);
		this.parent.remove(this.imgOver);
		this.parent.remove(this.text);
	};
	return ButtonWithOverAndText;
}(ButtonWithOverState));
var ButtonWithTween = /** @class */ (function () {
	function ButtonWithTween(parent, imgName, x, y, onClickFunction) {
		if (onClickFunction === void 0) { onClickFunction = function () {
		}; }
		this.imgName = imgName;
		this.parent = parent;
		this.x = x;
		this.y = y;
		this.imgNormal = SimpleGame.myGame.make.sprite(this.x, this.y, imgName);
		this.imgOver = SimpleGame.myGame.make.sprite(this.x, this.y, imgName);
		this.imgNormal.smoothed = true;
		this.imgNormal.anchor.set(0.5, 0.5);
		this.imgOver.anchor.set(0.5, 0.5);
		this.imgOver.alpha = 0.00000;
		parent.add(this.imgNormal);
		parent.add(this.imgOver);
		this.imgNormal.inputEnabled = true;
		this.imgOver.events.onInputOver.add(this.onButtonOver, this, 0);
		this.imgOver.events.onInputOut.add(this.onButtonOut, this, 1);
		this.imgOver.events.onInputDown.add(this.onButtonClicked, this, 2);
		this.onClickFunction = onClickFunction;
		this.loopEvent1 = SimpleGame.myGame.time.events.loop(10, this.update1, this);
		this.imgNormal.inputEnabled = false;
		this.imgOver.inputEnabled = true;
		this.imgOver.input.useHandCursor = true;
		// console.log(SimpleGame.myGame.device.android, SimpleGame.myGame.device.iOS);
	}
	ButtonWithTween.prototype.onButtonOver = function () {
		if (SimpleGame.myGame.device.touch)
			return;
		if (SimpleGame.myGame.device.android == false && SimpleGame.myGame.device.iOS == false) {
			this.buttonTween = SimpleGame.myGame.add.tween(this.imgNormal.scale).to({ x: 0.75, y: 0.75 }, 150, Phaser.Easing.Linear.None, true, 0, 1000000000000, true);
		}
		// console.log("start tween");
	};
	ButtonWithTween.prototype.onButtonOut = function () {
		if (this.buttonTween != null) {
			this.imgNormal.scale.set(1, 1);
			this.buttonTween.stop(true);
			SimpleGame.myGame.tweens.remove(this.buttonTween);
		}
	};
	ButtonWithTween.prototype.onButtonClicked = function () {
		// console.log("click registred");
		this.onClickFunction();
	};
	ButtonWithTween.prototype.update1 = function () {
		// throw new Error("Method not implemented.");
	};
	ButtonWithTween.prototype.remove = function () {
		SimpleGame.myGame.time.events.remove(this.loopEvent1);
		this.imgNormal.destroy();
		this.imgOver.destroy();
	};
	return ButtonWithTween;
}());
var CheckboxControl = /** @class */ (function () {
	function CheckboxControl(parent, uncheckedImageName, checkedImageName, x, y) {
		this.isChecked = false;
		this.x = x;
		this.y = y;
		var uncheckedImage = SimpleGame.myGame.make.sprite(x, y, uncheckedImageName);
		parent.add(uncheckedImage);
		uncheckedImage.inputEnabled = true;
		uncheckedImage.events.onInputDown.add(this.switchState, this);
		var checkedImage = SimpleGame.myGame.make.sprite(x, y, checkedImageName);
		parent.add(checkedImage);
		checkedImage.inputEnabled = true;
		checkedImage.events.onInputDown.add(this.switchState, this);
		this.uncheckedImage = uncheckedImage;
		this.checkedImage = checkedImage;
		this.update();
	}
	CheckboxControl.prototype.update = function () {
		if (this.isChecked) {
			this.uncheckedImage.visible = false;
			this.checkedImage.visible = true;
		}
		else {
			this.uncheckedImage.visible = true;
			this.checkedImage.visible = false;
		}
	};
	CheckboxControl.prototype.switchState = function () {
		this.isChecked = !this.isChecked;
		this.update();
	};
	return CheckboxControl;
}());
var FrameSequence = /** @class */ (function () {
	function FrameSequence(frameNameArr, x, y, frameRate) {
		this.paused = false;
		this.curIdx = 0;
		this.removeOnCompleteFlag = false;
		this.frameArr = new Array();
		this.x = x;
		this.y = y;
		var i = frameNameArr.length;
		while (i-- > 0) {
			this.frameArr[i] = SimpleGame.myGame.add.sprite(x, y, frameNameArr[i]);
			this.frameArr[i].anchor.set(0.5, 0.5);
			this.frameArr[i].visible = false;
		}
		this.frameArr[0].visible = true;
		this.timerEvent = SimpleGame.myGame.time.events.loop(Math.ceil(1000 / frameRate), this.update, this);
	}
	FrameSequence.prototype.putOnTop = function () {
		var i = this.frameArr.length;
		while (i-- > 0) {
			this.frameArr[i].bringToTop();
		}
	};
	FrameSequence.prototype.update = function () {
		if (this.paused)
			return;
		var i = this.frameArr.length;
		while (i-- > 0) {
			this.frameArr[i].visible = false;
		}
		var realidx = ++this.curIdx % this.frameArr.length;
		//    console.log(this.curIdx)
		this.frameArr[realidx].visible = true;
		this.frameArr[realidx].x = this.x;
		this.frameArr[realidx].y = this.y;
		this.curSpr = this.frameArr[realidx];
		if (realidx == 0 && this.curIdx > 1) {
			this.remove();
		}
	};
	FrameSequence.prototype.pause = function () {
		this.paused = true;
	};
	FrameSequence.prototype.start = function () {
		this.paused = false;
	};
	FrameSequence.prototype.remove = function () {
		SimpleGame.myGame.time.events.remove(this.timerEvent);
		var i = this.frameArr.length;
		while (i-- > 0) {
			var spr = this.frameArr[i];
			spr.destroy(true);
		}
		if (this.callOnRemove != null) {
			this.callOnRemove();
		}
	};
	return FrameSequence;
}());
var Utils;
(function (Utils) {
	var ScreenMetrics = /** @class */ (function () {
		function ScreenMetrics() {
		}
		return ScreenMetrics;
	}());
	Utils.ScreenMetrics = ScreenMetrics;
	var Orientation;
	(function (Orientation) {
		Orientation[Orientation["PORTRAIT"] = 0] = "PORTRAIT";
		Orientation[Orientation["LANDSCAPE"] = 1] = "LANDSCAPE";
	})(Orientation = Utils.Orientation || (Utils.Orientation = {}));
	;
	var ScreenUtils = /** @class */ (function () {
		function ScreenUtils() {
		}
		// -------------------------------------------------------------------------
		ScreenUtils.calculateScreenMetrics = function (aDefaultWidth, aDefaultHeight, aOrientation, aMaxGameWidth, aMaxGameHeight) {
			if (aOrientation === void 0) { aOrientation = Orientation.LANDSCAPE; }
			// get dimension of window
			var windowWidth = window.innerWidth;
			var windowHeight = window.innerHeight;
			// swap if window dimensions do not match orientation
			if ((windowWidth < windowHeight && aOrientation === Orientation.LANDSCAPE) ||
				(windowHeight < windowWidth && aOrientation === Orientation.PORTRAIT)) {
				var tmp = windowWidth;
				windowWidth = windowHeight;
				windowHeight = tmp;
			}
			// calculate max game dimension. The bounds are iPad and iPhone
			if (typeof aMaxGameWidth === "undefined" || typeof aMaxGameHeight === "undefined") {
				if (aOrientation === Orientation.LANDSCAPE) {
					aMaxGameWidth = Math.round(aDefaultWidth * 1420 / 1280);
					aMaxGameHeight = Math.round(aDefaultHeight * 960 / 800);
				}
				else {
					aMaxGameWidth = Math.round(aDefaultWidth * 960 / 800);
					aMaxGameHeight = Math.round(aDefaultHeight * 1420 / 1280);
				}
			}
			// default aspect and current window aspect
			var defaultAspect = (aOrientation === Orientation.LANDSCAPE) ? 1280 / 800 : 800 / 1280;
			var windowAspect = windowWidth / windowHeight;
			var offsetX = 0;
			var offsetY = 0;
			var gameWidth = 0;
			var gameHeight = 0;
			// if (aOrientation === Orientation.LANDSCAPE) {
			// "iPhone" landscape ... and "iPad" portrait
			if (windowAspect > defaultAspect) {
				gameHeight = aDefaultHeight;
				gameWidth = Math.ceil((gameHeight * windowAspect) / 2.0) * 2;
				gameWidth = Math.min(gameWidth, aMaxGameWidth);
				offsetX = (gameWidth - aDefaultWidth) / 2;
				offsetY = 0;
			}
			else {
				gameWidth = aDefaultWidth;
				gameHeight = Math.ceil((gameWidth / windowAspect) / 2.0) * 2;
				gameHeight = Math.min(gameHeight, aMaxGameHeight);
				offsetX = 0;
				offsetY = (gameHeight - aDefaultHeight) / 2;
			}
			/* } else {    // "iPhone" portrait
			 if (windowAspect < defaultAspect) {
			 gameWidth = aDefaultWidth;
			 gameHeight = gameWidth / windowAspect;
			 gameHeight = Math.min(gameHeight, aMaxGameHeight);
			 offsetX = 0;
			 offsetY = (gameHeight - aDefaultHeight) / 2;
			 } else {    // "iPad" portrait
			 gameHeight = aDefaultHeight;
			 gameWidth = gameHeight = windowAspect;
			 gameWidth = Math.min(gameWidth, aMaxGameWidth);
			 offsetX = (gameWidth - aDefaultWidth) / 2;
			 offsetY = 0;
			 }
			 }
			 */
			// calculate scale
			var scaleX = windowWidth / gameWidth;
			var scaleY = windowHeight / gameHeight;
			// store values
			this.screenMetrics = new ScreenMetrics();
			this.screenMetrics.windowWidth = windowWidth;
			this.screenMetrics.windowHeight = windowHeight;
			this.screenMetrics.defaultGameWidth = aDefaultWidth;
			this.screenMetrics.defaultGameHeight = aDefaultHeight;
			this.screenMetrics.maxGameWidth = aMaxGameWidth;
			this.screenMetrics.maxGameHeight = aMaxGameHeight;
			this.screenMetrics.gameWidth = gameWidth;
			this.screenMetrics.gameHeight = gameHeight;
			this.screenMetrics.scaleX = scaleX;
			this.screenMetrics.scaleY = scaleY;
			this.screenMetrics.offsetX = offsetX;
			this.screenMetrics.offsetY = offsetY;
			return this.screenMetrics;
		};
		return ScreenUtils;
	}());
	Utils.ScreenUtils = ScreenUtils;
})(Utils || (Utils = {}));
var Util = /** @class */ (function () {
	function Util() {
	}
	Util.convertToHHMMSS = function (seconds) {
		var s = seconds % 60;
		var m = Math.floor((seconds % 3600) / 60);
		var h = Math.floor(seconds / (60 * 60));
		//var hourStr:String = (h == 0) ? "" : doubleDigitFormat(h) + ":";
		var hourStr = (false) ? "" : Util.doubleDigitFormat(h) + ":";
		var minuteStr = Util.doubleDigitFormat(m) + ":";
		var secondsStr = Util.doubleDigitFormat(s);
		return hourStr + minuteStr + secondsStr;
	};
	Util.distanceTo = function (centre1, centre2) {
		return Math.sqrt(Math.pow(centre2.x - centre1.x, 2) + Math.pow(centre2.y - centre1.y, 2));
	};
	Util.CircleCollision = function (b1, b2) {
		var centre1 = new Phaser.Point(b1.x + GameConsts.BUBBLE_SIZE * 0.5, b1.y + GameConsts.BUBBLE_SIZE * 0.5);
		var centre2 = new Phaser.Point(b2.x + GameConsts.BUBBLE_SIZE * 0.5, b2.y + GameConsts.BUBBLE_SIZE * 0.5);
		var centre1 = new Phaser.Point(b1.x, b1.y);
		var centre2 = new Phaser.Point(b2.x, b2.y);
		if (Util.distanceTo(centre1, centre2) < GameConsts.BUBBLE_SIZE * 0.75) {
			return true;
		}
		return false;
	};
	Util.doubleDigitFormat = function (num) {
		if (num < 10) {
			return ("0" + num);
		}
		return "" + num;
	};
	Util.getStorage = function (s, defaultRetValue) {
		if (defaultRetValue === void 0) { defaultRetValue = 0; }
		var storageData = 0;
		try {
			storageData = parseInt(window.localStorage.getItem(s));
		}
		catch (error) {
			return 0;
		}
		if (isNaN(storageData)) {
			storageData = 0;
			window.localStorage.setItem(s, defaultRetValue.toString());
		}
		return storageData;
	};
	Util.setStorage = function (s, val) {
		try {
			window.localStorage.setItem(s, val.toString());
		}
		catch (error) {
		}
	};
	Util.getStringStorage = function (s, defaultRetValue) {
		if (defaultRetValue === void 0) { defaultRetValue = ""; }
		var storageData = "";
		try {
			storageData = (window.localStorage.getItem(s));
		}
		catch (error) {
			return "";
		}
		if (storageData == null) {
			storageData = "";
			window.localStorage.setItem(s, defaultRetValue.toString());
		}
		return storageData;
	};
	Util.setStringStorage = function (s, val) {
		try {
			window.localStorage.setItem(s, val.toString());
		}
		catch (error) {
		}
	};
	Util.clearStorage = function (s, defaultVal) {
		if (defaultVal === void 0) { defaultVal = 0; }
	};
	return Util;
}());
