SystemJS.config({
  baseURL:'/umd/',
  defaultExtension:false,
  packages:{
    ".":{
      main:'/src/index.js',
    }
  },
  meta:{
    '*.js':{
      'babelOptions':{
        react:true,
        es2015: true
      }
    },
    '*.css':{ loader:'css' },
    '*.json':{loader:'json'},
   '*.jpg':{loader:'url'}
    
  },
  map:{
    'plugin-babel':'systemjs-plugin-babel/plugin-babel.js',
    'systemjs-babel-build':'systemjs-plugin-babel/systemjs-babel-browser.js',
    'react':'react/umd/react.development.js',
    'react-dom':'react-dom/umd/react-dom.development.js',
    'css':'systemjs-plugin-css/css.js',
    'cropperjs':'cropperjs/dist/cropper.js',
    'cropper.css':'cropperjs/dist/cropper.min.css'
  },
  transpiler:'plugin-babel'
});

SystemJS.import('/src/index.js').then(()=>{
  /*
  if (window.location.search.includes('redirectedFrom')) {
    window.history.replaceState({}, '', window.location.href.split('?')[0]);
  }*/
  console.log("Modulo carregado con sucesso");
}).catch((error)=>{
 // window.location.reload();
  document.getElementById('abc').textContent= error;
  console.error.bind(console);
});