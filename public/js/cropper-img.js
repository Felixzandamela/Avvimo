document.addEventListener("DOMContentLoaded", function (){
  const imagePopup = document.querySelector("#imagePopup");
  const input_imge = document.querySelector("#input_imge");
  var cropperImg = document.querySelector("#cropper-img");
  const img_error = document.querySelector("#img_error");
  const src_img = document.querySelector("#src_img");
  const src = document.querySelector("#src");
  let cropper;
  input_imge.addEventListener("change", ()=>{
    const file=event.target.files[0];
    const reader= new FileReader();
    if(!/^image\/(jpeg|png|gif|bmp)$/.test(file.type)) {
      alert("Imagem não suportada");
      return;
    }
    reader.readAsDataURL(file);
    reader.onload=()=>{
      imagePopup.style.display = "flex";
      cropperImg.onload = initCropper;
      cropperImg.src = reader.result;
    };
  });
  const initCropper = () => {
    const newCropper = new Cropper(cropperImg, {
      zoomable: true,
      dragMode: 'move',
      aspectRatio: 1,
      autoCropArea: 1,
      scalable: true,
      cropBoxResizable: false,
      movable: true,
      checkCrossOrigin: true,
    });
    if(cropper){cropper.destroy();}
    cropper = newCropper;
  };
  const handlePreviewClick = () => {
    if (cropper && cropper.getCroppedCanvas()) {
      const croppedCanvas = cropper.getCroppedCanvas();
      if(croppedCanvas && croppedCanvas.toDataURL() !== null){
        const imgSrc = croppedCanvas.toDataURL();
        src_img.src = imgSrc;
        src.value = imgSrc;
        setTimeout(()=>{handleClose();},100);
      } else {showError("Erro ao obter a imagem cortado.");}
    } else {showError("O cortador de imagens não está respondendo.");}
  };
  const showError = function(value){
    img_error.innerHTML = value;
    setTimeout(()=>{img_error.innerHTML = "";},2000);
  }
  const handleClose = function(){
    if(cropper){cropper.destroy();}
    input_imge.value = "";
    imagePopup.style.display = "none";
  }
 const close_popup = document.querySelector("#close_popup");
  close_popup.addEventListener("click",()=>{handleClose();});
  const imageBtn = document.querySelector("#imageBtn");
  imageBtn.addEventListener("click", handlePreviewClick);
});