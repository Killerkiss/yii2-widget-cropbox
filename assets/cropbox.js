/**
 * Cropbox module of jQuery. A lightweight and simple plugin to crop your image. 
 * 
 * @author Nguyen Hong Khanh https://github.com/hongkhanh
 * @author Belosludcev Vasilij https://github.com/bupy7
 */

"use strict";
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function ($) {
    
    var cropbox = function(options, $th) {       
        var obj = {
                state:      {},
                ratio:      1,
                options:    options,
                imageBox:   $th,
                thumbBox:   $th.find('.thumbBox'),
                image:      new Image(),
                
                getDataURL: function (thumbWidth, thumbHeight) {
                    var canvas  = document.createElement("canvas"),
                        info    = this.getInfo(thumbWidth, thumbHeight);

                    canvas.width = info.width;
                    canvas.height = info.height;
                    var context = canvas.getContext("2d");
                    context.drawImage(this.image, 0, 0, info.sw, info.sh, info.dx, info.dy, info.dw, info.dh);
                    var imageData = canvas.toDataURL('image/png');
                    return imageData;
                },
                getInfo: function(thumbWidth, thumbHeight) {
                    var o = {
                        width:  thumbWidth,
                        height: thumbHeight,
                        dim:    $th.css('background-position').split(' '),
                        size:   $th.css('background-size').split(' ')
                    };
                    o.dx    = parseInt(o.dim[0]) - $th.width()/2 + o.width/2,
                    o.dy    = parseInt(o.dim[1]) - $th.height()/2 + o.height/2,
                    o.dw    = parseInt(o.size[0]),
                    o.dh    = parseInt(o.size[1]),
                    o.sh    = parseInt(this.image.height),
                    o.sw    = parseInt(this.image.width);
                    o.ratio = this.ratio;
                    
                    return o;
                },
                zoomIn: function () {
                    this.ratio *= 1.1;
                    setBackground();
                },
                zoomOut: function () {
                    this.ratio *= 0.9;
                    setBackground();
                }
            },
            setBackground = function() {
                var w = parseInt(obj.image.width) * obj.ratio,
                    h = parseInt(obj.image.height) * obj.ratio,
                    pw = ($th.width() - w) / 2,
                    ph = ($th.height() - h) / 2;

                $th.css({
                    backgroundImage:     'url(' + obj.image.src + ')',
                    backgroundSize:      w +'px ' + h + 'px',
                    backgroundPosition:  pw + 'px ' + ph + 'px',
                    backgroundRepeat:    'no-repeat'
                });
            },
            imgMouseDown = function(e) {
                e.stopImmediatePropagation();

                obj.state.dragable = true;
                obj.state.mouseX = e.clientX;
                obj.state.mouseY = e.clientY;
            },
            imgMouseMove = function(e) {   
                e.stopImmediatePropagation();

                if (obj.state.dragable) {
                    var x   = e.clientX - obj.state.mouseX,
                        y   = e.clientY - obj.state.mouseY,
                        bg  = $th.css('background-position').split(' '),
                        bgX = x + parseInt(bg[0]),
                        bgY = y + parseInt(bg[1]);

                    $th.css('background-position', bgX +'px ' + bgY + 'px');

                    obj.state.mouseX = e.clientX;
                    obj.state.mouseY = e.clientY;
                }
            },
            imgMouseUp = function(e) {
                e.stopImmediatePropagation();    
                obj.state.dragable = false;  
            };

        obj.image.onload = function() {
            setBackground();

            $th.bind('mousedown', imgMouseDown);
            $th.bind('mousemove', imgMouseMove);
            $(window).bind('mouseup', imgMouseUp);
        };
        obj.image.src = options.imgSrc;
        $th.on('remove', function(){ $(window).unbind('mouseup', imgMouseUp); });

        return obj;
    },
    methods = {
              
        resizeThumbBox: function($th, options) {
            $th.find('.thumbBox').css({
                width: options.width,
                height: options.height,
                marginTop: options.marginTop || options.height / 2 * -1 ,
                marginLeft: options.marginLeft || options.width / 2 * -1
            });
        },
        resizeImageBox: function($th, options) {
            $th.find('.imageBox').css({
                width: options.width,
                height: options.height
            });
        },
        clear: function($th) {
            $th.find('.btnCrop').addClass('disabled');
            $th.find('.btnZoomIn').addClass('disabled');
            $th.find('.btnZoomOut').addClass('disabled');
            $th.find('.imageBox').hide();
            $th.find('.message').hide();
            $th.find('.resize').hide();
        },
        init: function($th, options) {
            $th.find('.btnCrop').removeClass('disabled');
            $th.find('.btnZoomIn').removeClass('disabled');
            $th.find('.btnZoomOut').removeClass('disabled');
            $th.find('.imageBox').show();
            $th.find('.cropped').html('');
            $th.find('.message').show();
            $th.find('.resize').show();
            $('#' + options.idCropInfo).val('');
        }
    };   
            
    $.fn.cropbox = function(options) {  
        var $th = $(this),  
            crop = 1,
            indexSetting = 0,
            maxIndexSetting = options.cropSettings.length - 1,
            messages = typeof options.messages === 'undefined' ? false : options.messages;

        methods.clear($th);

        methods.resizeImageBox($th, {
            width: options.boxWidth,
            height: options.boxHeight
        });
        methods.resizeThumbBox($th, {
            width: options.cropSettings[indexSetting].width,
            height: options.cropSettings[indexSetting].height,
            marginTop: options.cropSettings[indexSetting].marginTop,
            marginLeft: options.cropSettings[indexSetting].marginLeft
        });
        
        if (messages) {
            $th.find('.message').html(messages[indexSetting]);
        }

        $th.find('.file').on('change', function() {
            var reader = new FileReader();
            reader.onload = function(e) {
                crop = new cropbox({
                    imgSrc: e.target.result
                }, $th.find('.imageBox'));
            };
            reader.readAsDataURL(this.files[0]);
            
            methods.init($th, {idCropInfo: options.idCropInfo});
        });
        $th.find('.btnCrop').on('click', function(){
            if (typeof crop === 'undefined') {
                return false;
            }
            var thumbWidth = options.cropSettings[indexSetting].width,
                thumbHeight = options.cropSettings[indexSetting].height,
                img = crop.getDataURL(thumbWidth, thumbHeight),
                info = crop.getInfo(thumbWidth, thumbHeight);

            $th.find('.cropped').append($('<img>', {
                class: 'img-thumbnail',
                src: img
            }));    
            
            var cropInfo = $('#' + options.idCropInfo).val();
            if (!cropInfo) {
                cropInfo = [];
            } else {
                cropInfo = JSON.parse(cropInfo);
            }
            cropInfo[indexSetting] = {
                x: info.dx,
                y: info.dy,
                dw: info.dw,
                dh: info.dh,
                ratio: info.ratio
            };
            $('#' + options.idCropInfo).val(JSON.stringify(cropInfo));
            
            ++indexSetting;
            if (indexSetting > maxIndexSetting) {
                indexSetting = 0;
                methods.clear($th);
            }
            methods.resizeThumbBox($th, {
                width: options.cropSettings[indexSetting].width,
                height: options.cropSettings[indexSetting].height,
                marginTop: options.cropSettings[indexSetting].marginTop,
                marginLeft: options.cropSettings[indexSetting].marginLeft
            });
            
            if (messages) {
                $th.find('.message').html(messages[indexSetting]);
            }
        });
        $th.find('.btnZoomIn').on('click', function(){
            if (typeof crop !== 'undefined') {
                crop.zoomIn();
            }
        });
        $th.find('.btnZoomOut').on('click', function(){
            if (typeof crop !== 'undefined') {
                crop.zoomOut();
            }
        });
    };
    
}));


