# Sheep!

The sheep are drawn with [Photopea](https://www.photopea.com/) with the brush
tool (B) at size 10 px, hardness 100%, with stylus pressure controlling size.

The images should be 650 by 500 px PNG files with black drawings on a white
background. [sheep-combinator.html](../sheep-combinator.html) will make these
translucent for UGWA; it relies on being hosted by
[http-server](https://www.npmjs.com/package/http-server). (Note that it might
depend on the version, given that the directory listing is by Ecstatic, which is
deprecated; I'm using v0.12.0.)

Then, in schedule/app.js, set the constant `SHEEP_COUNT` to the total number of
sheep.
