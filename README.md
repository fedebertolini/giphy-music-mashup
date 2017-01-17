# giphy-music-mashup
Create videos out of random animated gifs from [Giphy](https://giphy.com/) and random songs from [ccmixter](http://ccmixter.org/).

## Instalation
```
git clone git@github.com:fedebertolini/giphy-music-mashup.git
cd giphy-music-mashup
npm install
```

You can run the tests to make sure the installation was successful by executing:
```
npm run test
```

## Execution
The program has three optional input parameters: `giphy`, `ccmixter` and `output`. The first two indicate the term that is going to be used to search animates gifs and songs; `output` indicates the final video's path. If no parameters are provided, the program defaults to `--giphy=trippy`, `--ccmixter=psychedelic` and `--output="temp/{timestamp}-music.mp4"`.

```
node src/index.js --giphy=berlin --ccmixter=opera --output="temp/awesome.mp4"
```

## License
This project is licensed under the terms of the [MIT license](https://github.com/fedebertolini/giphy-music-mashup/blob/master/LICENSE).

The song used in this project's tests is [“I won't lock it down” by Jonathan Mann](https://soundcloud.com/wearecc/jonathan-mann-i-wont-lock-it-down), available under a [Creative Commons Attribution-Noncommercial license](https://creativecommons.org/licenses/by-nc/3.0/us/).

The video used in this project's tests belongs to [sample-videos.com](http://www.sample-videos.com/).
