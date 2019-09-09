
window.onload = function() {

    //環境變數
    var updateFPS = 30;
    var showMouse = true;
    var time = 0;
    var bgcolor = "black";

    //控制
    var controls = {
        value : 0,
    }

    var gui = new dat.GUI();
    gui.add(controls, "value", -2, 2).step(0.01).onChange(function(value) {

    });

    //--------------vec2 向量------------------

    class Vec2 {
        constructor(x, y){
            this.x = x || 0;
            this.y = y || 0;
        }

        set(x, y) {
            this.x = x;
            this.y = y;
        }
        
        move(x, y) {
            this.x += x;
            this.y += y;
        }

        add(v) {
            return new Vec2(this.x + v.x, this.y + v.y)
        }
        sub(v) {
            return new Vec2(this.x - v.x, this.y - v.y)
        }
        mul(s) {
            return new Vec2(this.x*s, this.y*s)
        }

        //新的向量長度
        set length(nv) {
            var temp = this.unit.mul(nv); //this.unit.mul(nv) 是1
            this.set(temp.x, this.y);
        }

        get length() {
            return Math.sqrt(this.x*this.x + this.y*this.y);
        }

        clone() {
            return new Vec2(this.x, this.y);
        }
        //轉成字串
        toString() {
            // return "("+this.x+","+this.y+")";
            return `(${this.x}, ${this.y})`;
        }
        //比較
        equal(){
            return this.x == v.x && this.y == v.y;
        }

        get angle() {
            return Math.atan2(this.y, this.x);
        }

        get unit() {
            return this.mul(1/this.length);
        }


    }
//------------------------------------------------------------
    var canvas = document.getElementById("canvas");
    var cx = canvas.getContext("2d");
   
    //設定畫圓
    cx.circle = function(v, r) {
        this.arc(v.x, v.y, r, 0, Math.PI*2);
    }
    //設定畫線
    cx.line = function (v1, v2) {
        this.moveTo(v1.x, v1.y);
        this.lineTo(v2.x, v2.y);
    }

    //環境數據
    var global = {
        scale: 1,
        width: 4000,
        height: 4000,
        foodmax: 500,  //食物最大數量
        playermax: 50, //玩家最大數量
        collideFactor: 1,  //分裂後是否可合併
    }

    //換算比例map
    function map(value, min, max, nmin, nmax) {
        var l1 = max - min;
        var l2 = nmax - nmin;
        var ratio = l2 / l1; //比例
        return (value - min) * ratio + nmin;
    }
     
    //玩家

    class Player {
        constructor(args) {
            var def = {
                id: parseInt(Math.random()*100000),
                p: new Vec2(),
                v: new Vec2(map(Math.random(), 0, 1, -5, 5), map(Math.random(),0, 1, -5, 5)),
                a: new Vec2(),
                mass: 100,
                living: true,
                color: `hsl(${Math.random()*360}, 60%, 50%)`,
            }
            Object.assign(def,args);
            Object.assign(this,def);
        }
        draw() {
            cx.fillStyle = this.color;
            cx.beginPath();
            cx.arc(this.p.x, this.p.y, this.r, 0, Math.PI*2);
            cx.fill();

            if(this.type !="food") {
                cx.font = "12px Arial";
                cx.fillStyle = "white";
                cx.textAlign = "center";
                cx.fillText (this.id, this.p.x, this.p.y);
            }
        }
        update() {
            this.p.move(this.v.x, this.v.y);
            this.v.move(this.a.x, this.a.y);
            this.a = this.a.mul(0.98);
            if(this.mass < 0) {
                this.living = false;
            }

            this.checkBoundary();
        }
        // 檢查邊界
        checkBoundary() {
            if(this.p.x - this.r < -global.width/2) {
                this.p.x = -global.width/2 + this.r;
            }
            if(this.p.x + this.r > global.width/2) {
                this.p.x = global.width/2 - this.r;
            }
            if(this.p.y - this.r < -global.height/2) {
                this.p.y = -global.height/2 + this.r;
            }
            if(this.p.y + this.r > global.height/2) {
                this.p.y = global.height/2 - this.r;
            }
        }
        eat(target) {
            TweenMax.to(this, 0.1, {
                mass: this.mass + target.mass,
            })
            target.living = false;
        }


        //計算屬性  根據本身屬性計算
        get r() {
            return Math.sqrt(this.mass);
        }
        //最大速度
        get maxSpeed() {
            return 30/(Math.log(this.r)+1)  // 不能讓分母變0
        }
    }

    players = []; //裝玩家跟食物
    myplayers = []; // 存在兩個陣列中

    // canvas的設定
    function initCanvas() {
 
        ww = canvas.width = window.innerWidth;
        wh = canvas.height =window.innerHeight;
    }
    initCanvas();


    //邏輯的初始化
    function init() {

        for (var i =0; i<300; i++) {
            players.push(new Player({
                mass: Math.random()*1000+20,
                p: new Vec2(
                    map(Math.random(), 0, 1, -global.width, global.width),
                    map(Math.random(), 0, 1, -global.height, global.height),
                )
            }))
        }

        myplayers.push(players[0]);
        
        //定時縮放畫布
        setInterval(function() {

            var scale = 1/Math.log(Math.sqrt(myplayers[0].r)/4+2);
            TweenMax.to(global, 2 ,{
                scale: scale,
            })

        },2000)

        //定時 新增食物及玩家
        setInterval(function() {
            // 限制食物上限 如果種類是食物且數量小於global.foodmax 就去新增
            if(players.filter(p=>p.type == "food").length < global.foodmax) {
                players.push(new Player({
                    mass: 10,
                    p: new Vec2 (map(Math.random(), 0, 1, -global.width, global.width),
                        map(Math.random(), 0, 1, -global.height, global.height)),
                    v: new Vec2(0, 0), // 食物不動
                    type: "food",
                }))
            }

            //新增玩家
            if(players.filter(p=>p.type != "food").length < global.playermax) {
                players.push(new Player({
                    mass: Math.random()*1000+20,
                    p: new Vec2(
                        map(Math.random(), 0, 1, -global.width, global.width),
                        map(Math.random(), 0, 1, -global.height, global.height),
                    )
                }))
            }
  
        },10)  //每隔10毫秒

    }

    //遊戲邏輯的更新
    function update() {

        time++;

        var myplayer = players[0];

        players.forEach((player, pid)=>{

            //如果還活著才去更新
            if (player.living) {
                player.update();

                // 倆倆比對 可不可吃
                players.forEach(function (player2, pid2) {

                    if (pid !=pid2 && player.id != player2.id && player2.living) {

                        //判斷球有在裡面 player 吃 player2 被吃 -10 判斷不要這麼嚴
                        if (player.r*0.9 > player2.r && player.p.sub(player2.p).length-10 <= (player.r - player2.r)) {

                            player.eat(player2);
                        }
                    }
                })
            }
           
        });

        var delta = mousePos.sub(new Vec2(ww/2, wh/2)).mul(0.1);  // 滑鼠中心位置跟視窗中心的相對位置，不能用canvas的位置，已經縮放過了
        var deltaLen = delta.length;  // 看這段長度

        if(deltaLen > myplayer.maxSpeed) {
            delta = delta.unit.mul(myplayer.maxSpeed);
        }

        myplayer.v = delta;  


        players = players.filter(p => p.living);
        myplayers = myplayers.filter(p => p.living);

        // 如果自己被別人吃了 ，再推一個屬性不是食物的第一個玩家當自己

        if(myplayers.length == 0) {
            myplayers.push(players.filter(p =>p.type != "food")[0]);
        }

    }

    //畫面更新
    function draw() {

        //清空背景
        cx.fillStyle = bgcolor;
        cx.fillRect(0, 0, ww, wh);

        //----在這繪製--------------------------------

        //讓myplayer 永遠在中央
        
        var cen = myplayers[0].p;

        cx.save();

        //先移到畫布中間
        cx.translate(ww/2, wh/2);
        //整張畫布縮放
        cx.scale(global.scale, global.scale);
        //再移到玩家的座標
        cx.translate(-cen.x, -cen.y);

        //網格
        var gridWidth = 250;
        var gcount = global.width/gridWidth; 
        for (var i= -gcount/2; i<= gcount/2; i++) {
            cx.moveTo(i * gridWidth, -global.height/2); //負的一半
            cx.lineTo(i * gridWidth, global.height/2);  //正的一半

            cx.moveTo(-global.width/2, i * gridWidth);
            cx.lineTo(global.width/2, i * gridWidth);
        }
        cx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        cx.stroke();

        
        // 讓比較小的球 蓋在自己身體下方，再被吃掉，依照半徑做排序，.slice() 新的陣列，.sort()排序，正的是大的，大的在後面
        players.slice().sort((p1,p2) => p1.r - p2.r).forEach(player=>{
            player.draw()});

        cx.restore();

        //寫上重量成績
        cx.font = "20px Arial";
        cx.fillStyle = "white";
        var score = myplayers.map(p=>p.mass).reduce((total,mass)=>(total+mass), 0);
        cx.fillText("Score:"+ parseInt(score),30, 30);




        //----------------------------------------

        //滑鼠
        cx.fillStyle = "red";
        cx.beginPath();
        cx.circle(mousePos,3);
        cx.fill();

        //滑鼠線
        cx.save();
            cx.beginPath();
            cx.translate(mousePos.x, mousePos.y);
              
                cx.strokeStyle = "red";
                var len = 20;
                cx.line(new Vec2(-len, 0), new Vec2(len, 0));

                cx.fillText (mousePos, 10, -10);
                cx.rotate(Math.PI/2);
                cx.line(new Vec2(-len, 0), new Vec2(len, 0));
                cx.stroke();

        cx.restore();




        requestAnimationFrame(draw)
    }

    //頁面載完依序呼叫
    function loaded() {

        initCanvas();
        init();
        requestAnimationFrame(draw);
        setInterval(update, 1000/updateFPS);
    }

    // window.addEventListener('load', loaded);
    //頁面縮放
    window.addEventListener('resize', initCanvas);


    //滑鼠 事件更新
    var mousePos = new Vec2(0, 0);
    var mousePosDown = new Vec2(0, 0);
    var mousePosUP = new Vec2(0, 0);

    window.addEventListener("mousemove",mousemove);
    window.addEventListener("mouseup",mouseup);
    window.addEventListener("mousedown",mousedown);

    function mousemove(evt) {
        // mousePos.set(evt.offsetX, evt.offsetY);
        mousePos.set(evt.x, evt.y);
        

    }
    function mouseup(evt) {
        // mousePos.set(evt.offsetX, evt.offsetY);
        mousePos.set(evt.x, evt.y);
        mousePosUP = mousePos.clone();
        
    }
    function mousedown(evt) {
        // mousePos.set(evt.offsetX, evt.offsetY);
        mousePos.set(evt.x, evt.y);
        mousePosDown = mousePos.clone();
    }

    loaded();
}
