import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit {
  @HostListener('document:keypress', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.chars.forEach((row) =>
      row.forEach((char) => {
        if (event.key.toLowerCase() === char.char) {
          this.addChar(char.char);
        }
      })
    );

    if (event.key === 'Enter') {
      this.addToResultsMatrix(this.textEntry);
    }
  }

  @HostListener('document:keydown.backspace', ['$event'])
  handleBackspaceEvent(event: any) {
    this.removeChar();
  }

  words: string[] = [];

  ngOnInit(): void {}

  chars: ValidationResult[][] = [];

  canShare = true;

  word: string = '';
  resultsMatrix: ValidationResult[][] = [];

  textEntry: string = '';

  maxAttempts = 4;

  constructor(private httpClient: HttpClient) {
    this.httpClient.get('assets/words.json').subscribe((data: any) => {
      var filteredWords = data.words.filter(
        (w: string) => w.length >= 4 && w.length <= 6
      );

      this.words = filteredWords; //.slice(0, 500);

      this.word = this.words[this.getRandomInt(this.words.length)];

      this.maxAttempts = this.word.length + 1;
    });

    let rowOne = this.setupKeyboardRow('qwertyuiop');
    let rowTwo = this.setupKeyboardRow('asdfghjkl');
    let rowThree = this.setupKeyboardRow('zxcvbnm');
    this.chars.push(rowOne);
    this.chars.push(rowTwo);
    this.chars.push(rowThree);
  }

  private setupKeyboardRow(chars: string) {
    return chars.split('').map((char) => new ValidationResult(char));
  }

  addChar(char: string) {
    if (this.textEntry.length < this.word.length) {
      this.textEntry += char;
    }
  }

  removeChar() {
    if (this.textEntry.length > 0) {
      this.textEntry = this.textEntry.slice(0, -1);
    }
  }

  validateEntry(entry: string) {
    let wordChars = [];
    let result: ValidationResult[] = [];

    for (var i = 0; i < this.word.length; i++) {
      // Setup word chars
      wordChars.push({ char: this.word[i], isUsed: false });

      // Setup result arr
      result.push(new ValidationResult(entry[i]));

      // Check chars for correct position
      if (wordChars[i].char === result[i].char) {
        result[i].setIsInCorrectPosition();

        wordChars[i].isUsed = true;

        this.chars.forEach((row) => {
          let matchingKey = row.find((c) => c.char === result[i].char);

          if (matchingKey !== undefined) {
            matchingKey.setIsInCorrectPosition();
          }
        });
      }
    }

    // Check out of position
    for (var i = 0; i < wordChars.length; i++) {
      if (wordChars[i].isUsed === false) {
        for (var j = 0; j < result.length; j++) {
          if (
            result[j].isInString === false &&
            result[j].char === wordChars[i].char
          ) {
            result[j].setIsInString();
            wordChars[i].isUsed = true;
            this.chars.forEach((row) => {
              let matchingKey = row.find((c) => c.char === result[j].char);

              if (matchingKey !== undefined) {
                matchingKey.setIsInString();
              }
            });
            break;
          }
        }
      }
    }

    // Mark incorrect letters on keyboard
    for (let i = 0; i < result.length; i++) {
      if (!result[i].isInString) {
        this.chars.forEach((row) => {
          let matchingKey = row.find((c) => c.char === result[i].char);

          if (matchingKey !== undefined) {
            matchingKey.setNotInString();
          }
        });
      }
    }

    return result;
  }

  getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  addToResultsMatrix(entry: string) {
    if (entry.length != this.word.length) {
      return;
    }

    if (this.resultsMatrix.length >= this.maxAttempts) {
      return;
    }

    if (!this.words.includes(entry)) {
      return;
    }

    var result = this.validateEntry(entry);

    this.resultsMatrix.push(result);
    this.clearTextEntry();
  }

  private clearTextEntry() {
    this.textEntry = '';
  }

  share() {
    var text = 'https://danielwinfield.uk/wordle-clone/\n';
    this.resultsMatrix.forEach((row) => {
      row.forEach((col) => {
        if (col.isInCorrectPosition) {
          text += '🟩';
        } else if (col.isInString) {
          text += '🟨';
        } else {
          text += '⬛️';
        }
      });
      text += '\n';
    });

    navigator.share({
      title: 'Dans Wordle',
      text: text,
    });
  }
}

export class ValidationResult {
  public char: string;
  public isInString: boolean;
  public isInCorrectPosition: boolean;
  public isNotInString: boolean;

  constructor(char: string) {
    this.char = char;
    this.isInCorrectPosition = false;
    this.isInString = false;
    this.isNotInString = false;
  }

  setIsInString() {
    this.isInString = true;
  }

  setIsInCorrectPosition() {
    this.isInCorrectPosition = true;
    this.isInString = true;
  }

  setNotInString() {
    this.isNotInString = true;
  }
}
