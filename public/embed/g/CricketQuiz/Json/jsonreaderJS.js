const category = "Cricket";
const textFileURL = "/embed/g/CricketQuiz/Json/Json.txt";

async function readTextFile() {
try {
    const response = await fetch(textFileURL);
    if (response.ok) {
      const text = await response.text();
      return text;
    } else {
      console.error('Failed to fetch the text file.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function getdata_Firbase_Quiz() {
  readTextFile()
    .then(text => {
      Gameinst.SendMessage('GameData', 'setTitle', category);
      Gameinst.SendMessage('GameManager', 'ShowQuizData', text);

      var defaultcoin = 0;
      var Lifecoin = 100;
      var rewardcoin = 10;
      var Timeout = 10;
      Gameinst.SendMessage('GameManager', 'set_OtherData', rewardcoin + "," + Lifecoin + "," + defaultcoin + "," + Timeout);
    });
}
