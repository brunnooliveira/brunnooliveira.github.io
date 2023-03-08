window.cartxCheckoutUrl = '';
                        var remove_cart_item = 1;
                        var keyAnimationcss = '<style>@keyframes spin {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}</style>';
                        var getHtmlHead = document.getElementsByTagName('head')[0];
                        getHtmlHead.insertAdjacentHTML('beforeend', keyAnimationcss);
                        
                        var checkoutBtncss = '<style id=\"cartx-btn-style\" type=\"text/css\"> body .cartx-CrtpageMainFrm input[type=\"submit\"]:not([name=\"update\"]), body .cartx-CrtpageMainFrm button[type=\"submit\"]:not([name=\"update\"]), body .cartx-CrtpageMainFrm button[type=\"button\"]:not([name=\"update\"]), body .cartx-CrtpageMainFrm button[type=\"button\"]:not([name=\"plus\"]), body .cartx-CrtpageMainFrm button[type=\"button\"]:not([name=\"minus\"]), body .cartx_check_mainBtn[name=\"checkout\"]:not([class*=\"cartx_elem_\"]):not([name=\"update\"]), body input.cartx_check_mainBtn:not([class*=\"cartx_elem_\"]):not([name=\"update\"]), .custom_class { display: none !important; }body .cartx-CrtpageMainFrm .cartx_check_mainBtn.cartx_elem_mainBtn[type=\"submit\"]{ display: inline-block !important;} </style>';
                        var e_param = '';
                        var eParamInterval = setInterval(function() {
                            if(getEParam()) {
                                e_param = getEParam();
                            }
                            if(e_param) {
                                clearInterval(eParamInterval);
                            }
                        }, 100);
                        
                        var utmParamInterval = setInterval(function() {
                            var u_param = '';
                            if(getUtmParam()) {
                                u_param = getUtmParam();
                                e_param += u_param;
                            }
                            if(u_param) {
                                clearInterval(utmParamInterval);
                            }
                        }, 100);
                        function showCartxLoader() {
                            var el = document.querySelector('.cartx-loader');
                            el.style.display = 'block';
                        }

                        function hideCartxLoader() {
                            var el = document.querySelector('.cartx-loader');
                            el.style.display = 'none';
                        }

                        // Cart
                        if (currentPage == 'cart') {
                            cartRedirect();
                        }

                        function getAjax(url, success) {
                            var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');
                            xhr.open('GET', url);
                            xhr.onreadystatechange = function() {
                                if (xhr.readyState > 3 && xhr.status==200) success(xhr.responseText);
                            };
                            // xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                            xhr.send();
                            return xhr;
                        }

                        function postAjax(url, data, success) {
                            var params = typeof data == 'string' ? data : Object.keys(data).map(
                                    function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
                                ).join('&');

                            var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
                            xhr.open('POST', url);
                            xhr.onreadystatechange = function() {
                                if (xhr.readyState>3 && xhr.status==200) { success(xhr.responseText); } else { if(xhr.status != 200) { hideCartxLoader(); } } 
                            };
                            // xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                            // xhr.setRequestHeader('Content-Type', 'application/json');
                            xhr.send(params);
                            return xhr;
                        }
                        
                        function shuffle(s) {
                            s = s.toString();
                            var arr = s.split('');           // Convert String to array

                            arr.sort(function() {
                                return 0.5 - Math.random();
                            });  
                            s = arr.join('');                // Convert Array to string
                            return s;                        // Return shuffled string
                        }

                        // Product
                        var cartxData = '';

                        if (window.$ || window.jQuery) {

                            var checkoutButtons = $('.btn-checkout');
                            checkoutButtons.each(function () {
                                var t = $(this);

                                if (t.attr('onclick') == "window.location='/checkout'") {
                                    t.attr('onclick', "window.location='/cart'");
                                }
                            });

                            if (currentPage == 'product' || currentPage == 'index') {
                                productRedirect();
                            }
                        }

                        function fakeClick(event) {
                            event.preventDefault();
                            showCartxLoader();
                            getAjax('/cart.json', function (response) {
                                var cartPayload = JSON.parse(response);
                                var cartPayload = removeArrayKey(cartPayload);

                                var data = {
                                    shop: shopName,
                                    host_name: window.location.host,
                                    cart_payload: cartPayload
                                };

                                postAjax(cartEndpoint, JSON.stringify(data), function (response) {
                                    var resp = JSON.parse(response);
                                    
                                    if(remove_cart_item) {
                                        jQuery.ajax({
                                            type: "POST",
                                            url: "/cart/clear.js",
                                            success: function () {
                                                window.location.href = resp.checkout_direct_url+e_param;
                                            },
                                            dataType: "json"
                                        });
                                    } else {
                                        window.location.href = resp.checkout_direct_url+e_param;
                                    }
                                });
                            });
                        }
                        
                        function productRedirect() {
                            var btn_selectors = $('input[name="add"] , button[name=\'add\'], #add-to-cart, .add-to-cart, #AddToCartText ,#AddToCart, .ProductForm__AddToCart, .shopify-payment-button__button, .shopify-payment-button__button--unbranded');
                                btn_selectors.attr('disabled', true);

                            var xhttp = new XMLHttpRequest();
                            xhttp.onreadystatechange = function() {
                                btn_selectors = $('input[name="add"] , button[name=\'add\'], #add-to-cart, .add-to-cart, #AddToCartText ,#AddToCart, .ProductForm__AddToCart, .shopify-payment-button__button, .shopify-payment-button__button--unbranded');
                                if (this.readyState == 4 && this.status == 200) {
                                    cartxData = JSON.parse(this.response);
                                    if (cartxData && cartxData.skip_cart) {
                                        btn_selectors.addClass("cartx_mainBtn cartx_elem_0");
                                        btn_selectors.removeAttr("disabled");

                                        $('.cartx_mainBtn').on('click', function(event){
                                            event.preventDefault();
                                            var form_count = $('form[action="/cart/add"]').length;
                                            if(typeof form_count != 'undefined' && form_count <= 1) {
                                                var form = $('form[action="/cart/add"]');
                                            } else {
                                                var form = $(this).parents('form[action="/cart/add"]');
                                            }
                                            /* var xhr = new XMLHttpRequest();
                                            xhr.open('POST', '/cart/add.js', true);
                                            // xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                                            xhr.onreadystatechange = function() {
                                                if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
                                                    window.location.href = '/cart?ref=cartx_buy_button'
                                                }
                                            }

                                            xhr.send($(form).serialize()); */

                                            $.post( "/cart/add.js", $(form).serialize(), function( data, status, XHR ) {

                                            }).
                                            always(function() {
                                              window.location.href = '/cart?ref=cartx_buy_button'+e_param
                                            });
                                        });
                                    } else {
                                        btn_selectors.removeAttr('disabled');
                                    }
                                }  else {
                                    btn_selectors.removeAttr('disabled');
                                }
                            };
                            xhttp.open('GET',cartEndpoint+'?shop=' + shopName);
                            xhttp.send();
                        }
                        
                        function cartRedirect() {
                            if(typeof cart_loading_message != 'undefined' && cart_loading_message != '') {
                                var message_element = document.getElementsByClassName("spinner-text");
                                for(var i = 0; i < message_element.length; i++){
                                    message_element[i].innerHTML = cart_loading_message;
                                }
                            }
                            if(typeof show_spinner != 'undefined' && show_spinner == 1) {
                                showCartxLoader();
                            }
                            getAjax('/cart.json', function (response) {
                                var cartPayload = JSON.parse(response);
                                var cartPayload = removeArrayKey(cartPayload);

                                var data = {
                                    shop: shopName,
                                    host_name: window.location.host,
                                    cart_payload: cartPayload
                                };

                                postAjax(cartEndpoint, JSON.stringify(data), function (response) {
                                    var resp = JSON.parse(response);
                                    remove_cart_item = resp.remove_cart_item;
                                    if (!resp.active) {
                                        hideCartxLoader();
                                    } else {

                                        var otherButtons = document.getElementsByClassName('cartx_check_mainBtn');

                                        for (var i = 0; i < otherButtons.length; i ++) {
                                            otherButtons[i].setAttribute('style', 'display: none !important');
                                        }

                                        window.cartxCheckoutUrl = resp.checkout_direct_url+e_param;
                                        var isFacebook = isFacebookApp();
                                        var isAndroid = isAndroidApp();
                                        if (resp.skip_cart && resp.checkout_direct_url != '' && isFacebook == false && isAndroid == false) {
                                            if(remove_cart_item) {
                                                jQuery.ajax({
                                                    type: "POST",
                                                    url: "/cart/clear.js",
                                                    success: function () {
                                                        window.location.href = resp.checkout_direct_url+e_param;
                                                    },
                                                    dataType: "json"
                                                });
                                            } else {
                                                window.location.href = resp.checkout_direct_url+e_param;
                                            }

                                        } else if (resp.skip_cart && resp.checkout_direct_url != '' && isFacebook == true && isAndroid == false) {
                                            if(remove_cart_item) {
                                                jQuery.ajax({
                                                    type: "POST",
                                                    url: "/cart/clear.js",
                                                    success: function () {
                                                        window.location.href = resp.checkout_direct_url+e_param;
                                                    },
                                                    dataType: "json"
                                                });
                                            } else {
                                                window.location.href = resp.checkout_direct_url+e_param;
                                            }

                                        } else if (resp.skip_cart && resp.checkout_direct_url != '' && isFacebook == false && isAndroid == true) {
                                            if(remove_cart_item) {
                                                jQuery.ajax({
                                                    type: "POST",
                                                    url: "/cart/clear.js",
                                                    success: function () {
                                                        window.location.href = resp.checkout_direct_url+e_param;
                                                    },
                                                    dataType: "json"
                                                });
                                            } else {
                                                window.location.href = resp.checkout_direct_url+e_param;
                                            }

                                        } else {
                                            if (resp.checkout_direct_url != '' && localStorage.getItem('buynow') === "true") {
                                                // Limpa o carrinho do Shopify
                                                if(remove_cart_item) {
                                                    postAjax('/cart/clear.js', JSON.stringify({}), function () {
                                                        localStorage.setItem('buynow', false);
                                                        window.location.href = resp.checkout_direct_url+e_param;
                                                    });
                                                } else {
                                                    localStorage.setItem('buynow', false);
                                                    window.location.href = resp.checkout_direct_url+e_param;
                                                }
                                            } else {
                                                hideCartxLoader();
                                                var getHead = document.getElementsByTagName('head')[0];
                                                getHead.insertAdjacentHTML('beforeend', checkoutBtncss);
                                                var getForm = document.getElementsByTagName('form'); var cartFrmId,getCheckoutBtn;
                                                var buttonAdded = 0;
                                                var prevent_add_button = 0;
                                                if(typeof has_multiple_buttons != 'undefined') {
                                                    prevent_add_button = has_multiple_buttons;
                                                }
                                                for (var i = 0; i < getForm.length; i++) {
                                                    var formAction = getForm[i].action;  formAction = formAction.split(shop);
                                                    var url_value = '';
                                                    if(typeof formAction[1] != 'undefined') {
                                                        url_value = formAction[1];
                                                    }
                                                    if (formAction.includes('/cart') == true || formAction[0].includes('/cart') == true  || formAction.indexOf('/cart') !== -1 || url_value.indexOf('/cart') !== -1 || formAction.includes('/checkout') == true || formAction[0].includes('/checkout') == true  || formAction.indexOf('/checkout') !== -1 || url_value.indexOf('/checkout') !== -1) {
                                                        if (getForm[i].getAttribute('id')){
                                                            cartFrmId = getForm[i].getAttribute('id');
                                                        } else {
                                                            getForm[i].setAttribute('id','cartx-CrtpageMainFrm'); cartFrmId = getForm[i].getAttribute('id');
                                                        }
                                                        getForm[i].classList.add('cartx-CrtpageMainFrm');
                                                        
                                                        getCheckoutBtn = getForm[i].elements['checkout'] || getForm[i].querySelector('a[href="/checkout"]') || getForm[i].querySelector('a[href="/checkout"]') || getForm[i].querySelector('form[action="/cart"] input[type="submit"]') || getForm[i].querySelector('form[action="/checkout"] button[type="submit"]') || getForm[i].querySelector('button[type="submit"]') || getForm[i].querySelector('form[action="/cart"] button[type="submit"]') || getForm[i].querySelector('form[action="/cart"] button[type="button"]');
                                                        if(getCheckoutBtn != null) {
                                                            var button_width = 'auto';
                                                            if (getCheckoutBtn.length == undefined) {
                                                                var buttonValue = getCheckoutBtn.value ? getCheckoutBtn.value : getCheckoutBtn.innerHTML;
                                                                var button_width = getCheckoutBtn.style.width;
                                                            } else {
                                                                var lastBtnID = getCheckoutBtn.length - 1;
                                                                var button_width = getCheckoutBtn[lastBtnID].style.width;
                                                                var buttonValue = getCheckoutBtn[lastBtnID].value ? getCheckoutBtn[lastBtnID].value : getCheckoutBtn[lastBtnID].innerHTML;
                                                            }
                                                            var getSubBtnId = getCheckoutBtn.id;
                                                            if (getSubBtnId) {
                                                                getSubBtnId = getSubBtnId+'cartxButton';
                                                            } else {
                                                                getSubBtnId = 'cartxBtn';
                                                            }
                                                            var d = new Date();
                                                            var time = shuffle(d.getTime());
                                                            getSubBtnId = getSubBtnId+time;

                                                            if (getCheckoutBtn.length == undefined) {
                                                                if(buttonAdded == 0) {
                                                                    var inptBtn = `<button type='submit' class='`+getCheckoutBtn.className+` cartx_check_mainBtn cartx_elem_mainBtn' id='`+getSubBtnId+`' style='width: `+button_width+`'>`+buttonValue+`</button>`;
                                                                    getCheckoutBtn.insertAdjacentHTML('afterEnd', inptBtn);
                                                                    if(prevent_add_button == 0) {
                                                                        buttonAdded++;
                                                                    }
                                                                    document.getElementById(getSubBtnId).addEventListener('click', fakeClick);
                                                                    if (resp.skip_cart && resp.checkout_direct_url != '') {
                                                                        document.getElementById(getSubBtnId).click();
                                                                    }
                                                                }
                                                            } else {
                                                                var total_button = getCheckoutBtn.length;
                                                                for (var button_count = 0; button_count < total_button; button_count++) {
                                                                    var new_btn_id = getSubBtnId+button_count;
                                                                    var button_display = getCheckoutBtn[button_count].style.display;
                                                                    if(button_display != 'none') {
                                                                        var inptBtn = `<button type='submit' class='`+getCheckoutBtn[button_count].className+` cartx_check_mainBtn cartx_elem_mainBtn' id='`+new_btn_id+`' style='width: `+button_width+`'>`+buttonValue+`</button>`;
                                                                        getCheckoutBtn[button_count].insertAdjacentHTML('afterEnd', inptBtn);
                                                                        document.getElementById(new_btn_id).addEventListener('click', fakeClick);
                                                                    }
                                                                }
                                                                if (resp.skip_cart && resp.checkout_direct_url != '') {
                                                                    document.getElementById(new_btn_id).click();
                                                                }
                                                            }
                                                            getCheckoutBtn.classList.add("custom_class");
                                                        }
                                                    }
                                                }

                                                // Tratamento com links dentro do carrinho.
                                                if (window.$ || window.jQuery) {
                                                    var btns = $('a.btn-checkout[href="/checkout"]').not('.cartx_elem_mainBtn');
                                                    btns.hide();
                                                }
                                            }
                                        }
                                    }
                                });

                            });
                        }
                        // Verifica se existem botÃµes redirecionando para /a/checkout
                        if (window.$ || window.jQuery) {
                            var oldLinks = $('a[href="/a/checkout"]').not('.cartx-btn-finalize').addClass('cartx-btn-finalize-single');

                            $('.cartx-btn-finalize-single').on('click', function (e) {
                                e.preventDefault();

                                if (currentPage == 'cart') {
                                    if(remove_cart_item) {
                                        jQuery.ajax({
                                            type: "POST",
                                            url: "/cart/clear.js",
                                            success: function () {
                                                window.location.href = window.cartxCheckoutUrl;
                                            },
                                            dataType: "json"
                                        });
                                    } else {
                                        window.location.href = window.cartxCheckoutUrl;
                                    }
                                } else {
                                    window.location = '/cart';
                                }

                            });
                        }
                        
                        function isFacebookApp() {
                            var ua = navigator.userAgent || navigator.vendor || window.opera;
                            return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1);
                        }
                        
                        function isAndroidApp() {
                            var ua = navigator.userAgent.toLowerCase() || navigator.vendor.toLowerCase() || window.opera.toLowerCase();
                            return (ua.indexOf("android") > -1);
                        }
                        
                        function getEParam() {
                            var linkerParam = false;
                            try {
                                if(typeof ga !== "undefined") {
                                    ga(function(tracker) {
                                        linkerParam =  '&' + tracker.get('linkerParam');
                                    });
                                }
                                return linkerParam;
                            } catch (error) {
                                return linkerParam;
                            }
                        }
                        function getUtmParam() {
                            var utm_value = getCartXCookie('_shopify_sa_p');
                            if(utm_value != '') {
                                return '&'+decodeURIComponent(utm_value);
                            }
                            return false;
                        }
                        function getCartXCookie(cname) {
                            var name = cname + "=";
                            // var decodedCookie = decodeURIComponent(document.cookie);
                            var decodedCookie = document.cookie;
                            var ca = decodedCookie.split(';');
                            for(var i = 0; i <ca.length; i++) {
                                var c = ca[i];
                                while (c.charAt(0) == ' ') {
                                    c = c.substring(1);
                                }
                                if (c.indexOf(name) == 0) {
                                    return c.substring(name.length, c.length);
                                }
                            }
                            return "";
                        }
                        function removeArrayKey(data = null, key_1 = 'product_description') {
                            if(data) {
                                if(typeof data.items != 'undefined') {
                                    var cart_items = data.items;
                                    if(typeof jQuery != 'undefined') {
                                        jQuery.each(cart_items, function(key, cart_item) {
                                            delete cart_items[key][key_1];
                                        });
                                    }
                                }
                            }
                            return data;
                        }