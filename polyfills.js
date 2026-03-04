// Polyfill DOMMatrix for pdfjs-dist (browser API not available in Bun/Node)
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(init) {
      this.a=1;this.b=0;this.c=0;this.d=1;this.e=0;this.f=0;
      this.m11=1;this.m12=0;this.m13=0;this.m14=0;
      this.m21=0;this.m22=1;this.m23=0;this.m24=0;
      this.m31=0;this.m32=0;this.m33=1;this.m34=0;
      this.m41=0;this.m42=0;this.m43=0;this.m44=1;
      this.is2D=true;this.isIdentity=true;
      if (Array.isArray(init) && init.length === 6) {
        [this.a,this.b,this.c,this.d,this.e,this.f] = init;
        this.m11=this.a;this.m12=this.b;this.m21=this.c;this.m22=this.d;this.m41=this.e;this.m42=this.f;
      }
    }
    inverse() { return new DOMMatrix(); }
    multiply() { return new DOMMatrix(); }
    scale() { return new DOMMatrix(); }
    translate() { return new DOMMatrix(); }
    transformPoint(p={}) { return {x:p.x||0,y:p.y||0,z:p.z||0,w:p.w||1}; }
  };
}
