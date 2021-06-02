#include "LedControl.h"// max 7219 ile led kontrol kütüphanesi
#include "Timer.h"
 
#define LEDPIN 9 // led pini
#define BUZZERPIN 8 // buzzer pini
#define PADSIZE 3 //oynanacak çubuğun uzunluğu
#define BALL_DELAY 400
#define GAME_DELAY 10
#define BOUNCE_VERTICAL 1
#define BOUNCE_HORIZONTAL -1
#define NEW_GAME_ANIMATION_SPEED 50  //define ile yapılan değişiklikler ilk yazılan veriyle yanına yazılan value için derlerken kodda yer değiştirmesini sağlar
#define HIT_NONE 0
#define HIT_NONE 0
#define HIT_CENTER 1
#define HIT_LEFT 2
#define HIT_RIGHT 3

 
//#define DEBUG 1
 
byte sad[] = {
B00000000,
B01000100,//dot matrix için 8x8 lik matriks tanımlandı ve her bir lede HIGH konumu için 1, LOW konumu için 0 verildi
B00010000,
B00010000,
B00000000,
B00111000,
B01000100,
B00000000
};
 
byte smile[] = {
B00000000,
B01000100,
B00010000,//dot matrix için 8x8 lik matriks tanımlandı ve her bir lede HIGH konumu için 1, LOW konumu için 0 verildi
B00010000,
B00010000,
B01000100,
B00111000,
B00000000
};
//byte ad[] = {
//B11100110,
//B11100101,//dot matrix için 8x8 lik matriks tanımlandı ve her bir lede HIGH konumu için 1, LOW konumu için 0 verildi
//B10000101,
//B10111110,
//B00100000,
//B00111000,
//B00100000,
//B00111000
//};



 
Timer timer; // timer.h kütüphanesi yardımıyla kullanılmak üere zamanlayıcı tanımlandı.
 
LedControl lc = LedControl(12,11,10,1);//led control kütüphanesine MAX7219 driver için kullanılacak pinleri tanımladık. son rakam ise kullanılacak driver sayısıdır.
 
byte direction; //Rüzgar gülü, 0 kuzeydir
int xball;
int yball;
int yball_prev;
byte xpad;
int ball_timer;

int bluetoothVal; // bluetooth veri akışı için kullanılacak string tanımlandı

void setSprite(byte *sprite){
    for(int r = 0; r < 8; r++){
        lc.setRow(0, r, sprite[r]);//ilk değer matrix adresidir 1 matriks olduğundan 0 değeri verilir. ikinci parametre satırlar arasında gezmemizi sağlar. üçüncü parametrede satırdaki yanacak ledleri byte cinsinden verir (dizideki değerler alınacak
    }
}
 
void newGame() {
    lc.clearDisplay(0); //tüm ledler adresteki matriks için söner
    // x ve y pozisyonlarına değer verme
    xball = random(1, 7);// 1ve 7 arasında random sayı üretir.
    yball = 1;
    direction = random(3, 6); // Güneye gider
    for(int r = 0; r < 8; r++){
        for(int c = 0; c < 8; c++){
            lc.setLed(0, r, c, HIGH);// satır ve sütunlardaki ledi row coulmn numarasına göre yakar.
            delay(NEW_GAME_ANIMATION_SPEED);//define ile tanımlanmış süre kadar bekletir
        }
    }
    setSprite(smile);//gülen yüz çalıştırılır.
    delay(1500);//1.5 sn bekler
    lc.clearDisplay(0);//matriks ledleri söndürülür.
}
 
void setPad(int x) {

    xpad = x;// çubuğa konum verilmiştir
  
}
 
void debug(const char* desc){// konumları kontrol etmek için yazılmış fonksiyondur
#ifdef DEBUG
    Serial.print(desc);
    Serial.print(" XY: ");
    Serial.print(xball);
    Serial.print(", ");//topun x ve y koordinatlarını basar
    Serial.print(yball);
    Serial.print(" XPAD: ");//çubuğun konumunu basar
    Serial.print(xpad);
    Serial.print(" DIR: ");//direction bastırır
    Serial.println(direction);
#endif
}
 
int checkBounce() {
    if(!xball || !yball || xball == 7 || yball == 6){//xball veya yball null değilse veya xball 7 ise veya yball 6 ise
        int bounce = (yball == 0 || yball == 6) ? BOUNCE_HORIZONTAL : BOUNCE_VERTICAL;// yball 0 veya yball 6 ise 1 horizontal veya -1 vertical değerini ata
#ifdef DEBUG
        debug(bounce == BOUNCE_HORIZONTAL ? "HORIZONTAL" : "VERTICAL");// BOUNCE_HORIZONTAL bounce değerindeyse horizontal kelimesini değilse vertical kelimesini  debug fonksiyonuna gönderir.
#endif
        return bounce;//bounce değerini döndürür
    }
    return 0;
}
 
int getHit() {// çarpma var mı var ise koordinatını alır
    if(yball != 6 || xball < xpad || xball > xpad + PADSIZE){
        return HIT_NONE;
    }
    if(xball == xpad + PADSIZE / 2){
        return HIT_CENTER; //oynanan çubuğun ortasına çarpıp çarpmadığına bakar
    }
    return xball < xpad + PADSIZE / 2 ? HIT_LEFT : HIT_RIGHT; //ne tarafa çarptığını döndürür
}
 
bool checkLoose() {
    return yball == 6 && getHit() == HIT_NONE; // oyuncunun kaybedip kaybetmediğini kontrol eder.
}
 
void moveBall() {
    debug("MOVE"); // debug fonksiyonuna move gönderir
    int bounce = checkBounce(); // fonksiyondan değeri alır.
    if(bounce) { // sektiği yere göre konumu değişecek
        switch(direction){
            case 0:
                direction = 4; //yukarıdaysa aşağı inecektir
            break;
            case 1:
                direction = (bounce == BOUNCE_VERTICAL) ? 7 : 3; //geldiği tarafa göre 1 veya 5 yönüne gider. saat 4 ve 10 arası
            break;
            case 2:
                direction = 6;//saat 3 yönünden saat 9 yönüne yönleneceğini belirtiyor
            break;
            case 6:
                direction = 2; //saat 9 yönünden saat 3 yönüne yönleneceğini belirtiyor
            break;
            case 7:
                direction = (bounce == BOUNCE_VERTICAL) ? 1 : 5; // geldiği tarafa göre 1 veya 5 yönüne gider. saat 8 ve 2 yönü arası
            break;
            case 5:
                direction = (bounce == BOUNCE_VERTICAL) ? 3 : 7; //geldiği tarafa göre 1 veya 5 yönüne gider. saat 4 ve 10 arası
            break;
            case 3:
                direction = (bounce == BOUNCE_VERTICAL) ? 5 : 1; // geldiği tarafa göre 1 veya 5 yönüne gider.saat 8 ve 2 yönü arası
            break;
            case 4:
                direction = 0; //aşağıdaysa yukarı çıkacaktır
            break;
        }
        debug("->");
    }
 
    
    switch(getHit()){
        case HIT_LEFT:
            if(direction == 0){//çubuğun sol tarafına vurduysa ve yönü yukarı doğruysa direction saat 10 yönüne doğru ayarla
                direction =  7;
            } else if (direction == 1){ //çubuğun sol tarafına vurduysa ve yönü saat 2 yönüne doğruysa  direction saat yukarı doğru ayarla
                direction = 0;
            }
        break;
        case HIT_RIGHT:
            if(direction == 0){// çubuğun sağ tarafına vurulduysa ve yön yukarı doğruysa direction saat 2 yönüne ayarla
                direction = 1;
            } else if(direction == 7) {// çubuğun sağ tarafına vurulduysa ve yön saat 10 yönüne doğruysa direction yukarı yöne ayarla
                direction = 0;
            }
        break;
    }
 
    // kenar ve ortagonal kontrolleri
    if((direction == 0 && xball == 0) || (direction == 4 && xball == 7)){ // direction  yukarı doğru ve xball  0 ise veya direction  aşağı doğru ve xball  7 ise sağa döndür
        direction++; 
    }
    if(direction == 0 && xball == 7){ // direction  yukarı doğru ve xball  7 ise direction saat 10 yönüne ayarla
        direction = 7;
    }
    if(direction == 4 && xball == 0){// direction  aşağı doğru ve xball  0 ise direction saat 4 yönüne ayarla
        direction = 3;
    }
    if(direction == 2 && yball == 0){ // direction  saat 3 yönüne doğru ve yball  0 ise direction saat 4 yönüne ayarla
        direction = 3;
    }
    if(direction == 2 && yball == 6){ // direction  saat 3 yönüne doğru ve yball  6 ise direction saat 2 yönüne ayarla
        direction = 1;
    }
    if(direction == 6 && yball == 0){// direction  saat 9 yönüne doğru ve yball  0 ise direction saat 8 yönüne ayarla
        direction = 5;
    }
    if(direction == 6 && yball == 6){// direction  saat 9 yönüne doğru ve yball  6 ise direction saat 10 yönüne ayarla
        direction = 7;
    }
    
    // köşelere çarparsa
    if(xball == 0 && yball == 0){ // sol üst köşeye çarparsa direction saat 4 yönüne alınır
        direction = 3;
    }
    if(xball == 0 && yball == 6){ // sol alt köşeye çarparsa direction saat 2 yönüne alınır
        direction = 1;
    }
    if(xball == 7 && yball == 6){ // sağ alt köşeye çarparsa direction saat 10 yönüne alınır
        direction = 7;
    }
    if(xball == 7 && yball == 0){
        direction = 5; // sağ üst köşeye çarparsa direction saat 8 yönüne alınır
    }
 
    yball_prev = yball;
    if(2 < direction && direction < 6) {// yön saat 3 ile 9 arasındaysa y artar
        yball++;
    } else if(direction != 6 && direction != 2) {// yön saat 3 ile 9 arasında değilse y azalır
        yball--;
    }
    if(0 < direction && direction < 4) {//  yön saat 12 ile 6 arasındaysa x artar
        xball++;
    } else if(direction != 0 && direction != 4) { //  yön saat 12 ile 6 arasında degilse x azalır
        xball--;
    }
    xball = max(0, min(7, xball));// xball değerine alabileceği en büyük değeri verir
    yball = max(0, min(6, yball));// yball değerine alabileceği en büyük değeri verir
    debug("AFTER MOVE");
}
 
void gameOver() {
    setSprite(sad);// üzgün yüzü bastırır
    delay(1500);// 1.5 sn bekler
    lc.clearDisplay(0);// tüm ledleri söndürür
}
 
void drawGame() {// oyunu çizdirir
    if(yball_prev != yball){ // topun y koordinatı öncekinden farklıysa
        lc.setRow(0, yball_prev, 0); // matriksin  yball_prev indeksli satırda tüm ledleri söndürür
    }
    lc.setRow(0, yball, byte(1 << (xball))); // matriksin yball indeksli satırındaki ledleri sola kaydırarak yakar.
    byte padmap = byte(0xFF >> (8 - PADSIZE) << xpad) ; // çubuğu gelen isteğe göre kaydırır.
#ifdef DEBUG
    //Serial.println(padmap, BIN);
#endif
    lc.setRow(0, 7, padmap); // kaydırıldıktan sonra çubuğu çizdirir
}

void isimyazdir(){
  
    
    byte birinci =B11100110;
    byte ikinci =B11100101;//dot matrix için 8x8 lik matriks tanımlandı ve her bir lede HIGH konumu için 1, LOW konumu için 0 verildi
    byte ucuncu=B10000101;
    byte dorduncu=B10111110;
    byte besinci=B00100000;
    byte altinci=B00111000;
    byte yedinci=B00100000;
    byte sekizinci=B00111000;


    //B11100110,
//B11100101,//dot matrix için 8x8 lik matriks tanımlandı ve her bir lede HIGH konumu için 1, LOW konumu için 0 verildi
//B10000101,
//B10111110,
    int i=0;
    while(i<=7){


    byte ad[] = {birinci,ikinci,ucuncu,dorduncu,besinci,altinci,yedinci,sekizinci};
    setSprite(ad);
    delay(500);
    birinci= byte(birinci >> 1);
    ikinci= byte(ikinci >> 1);
    ucuncu= byte(ucuncu >> 1);
    dorduncu= byte(dorduncu >> 1);
    besinci= byte(besinci >> 1);
    altinci= byte(altinci >> 1);
    yedinci= byte(yedinci >> 1);
    sekizinci= byte(sekizinci >> 1);
    i=i+1;
    
    }  


  }


 
void setup() {

  pinMode(LEDPIN, OUTPUT); // 9 numaralı pini çıkış pini olarak ayarlıyoruz, led için kullanılıyor            
  pinMode(BUZZERPIN, OUTPUT); // 8 numaralı pini çıkış pini olarak ayarlıyoruz, buzzer için kullanılıyor     
    

  Serial.begin(9600); // serial portu açar, saniyede 9600 bit yollar      
 
  lc.shutdown(0,false); // max7219 driver güç tasarrufundan çıkarılır
  
  lc.setIntensity(0, 8);// 0 nolu led matriksin 8 seviyesinde led parlaklığını ayarlar (0 dan 15 e kadar ayarlanabilir 
  
  lc.clearDisplay(0);// tüm ledleri söndürür
  randomSeed(analogRead(0)); /// A0 pininden değer okur o değerde rastgele bir dizi oluşturur ve bu dizidei rastgele bir noktadan başlangıç seçer
#ifdef DEBUG
  
  Serial.println("Pong");
#endif
  newGame();// yeni oyunu başlatır
  ball_timer = timer.every(BALL_DELAY, moveBall);// her 200 msde moveball fonksiyonunu çalıştırır
}
 
void loop() {
  if (Serial.available())// tanımlanan pinlerle bağlantı kurulabiliyorsa(veri akışı yapılabilecekse)
  {

    bluetoothVal = Serial.read();// telefondan gelen string değeri bluetooth modülü okur
    
    if(bluetoothVal == 54){
                    
        digitalWrite(LEDPIN, LOW);  // led söner     
       
    }
    else if(bluetoothVal == 55){
              
        digitalWrite(LEDPIN, HIGH);  // led yanar 
   
    }
    else if(bluetoothVal == 56){
              
        tone(BUZZERPIN, 1000); // buzzerın ses vermesini sağlar
        delay(100); // 0.1 saniye gecikme sağlar
        noTone(BUZZERPIN); // buzzerı durdudur        
   
    }
    else {
        
        setPad(bluetoothVal % 6);  // gelen değere göre( modunu alarak) çubuğu hareket ettirir. 
       
    }
    
  }
    timer.update();// zamanlayıcıyı günceller
    
    
// setPad();// çubuğu hareket ettir
    
#ifdef DEBUG
    Serial.println(xpad);//debug modda konumunu basar
#endif
    // Ekranı günceller 
    drawGame();// oyuunu çizdirir
    if(checkLoose()) {// kaybedip etmediğini kontrol eder.
        debug("LOOSE");
        gameOver();// game over fonksiyonu çalışır
        isimyazdir();
        newGame();// yeniden oyunu başlatır
    }
    delay(GAME_DELAY);// loop aralarında bekleme süresi
}
