// 拦截并记录 contact_info API 请求
// 在抖音达人主页控制台运行，然后点击眼睛图标

(function() {
  console.log('🎯 开始拦截 API 请求...\n');
  console.log('💡 现在请点击页面上的眼睛图标\n');
  
  // 保存原始的 fetch 和 XMLHttpRequest
  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest;
  
  // 拦截 fetch 请求
  window.fetch = function(...args) {
    const url = args[0];
    
    if (url.includes('contact_info') || url.includes('contact')) {
      console.log('🔍 拦截到 fetch 请求:');
      console.log('  URL:', url);
      console.log('  参数:', args[1]);
      
      return originalFetch.apply(this, args).then(response => {
        // 克隆响应以便读取
        const clonedResponse = response.clone();
        
        clonedResponse.json().then(data => {
          console.log('\n📦 响应数据:');
          console.log(JSON.stringify(data, null, 2));
          
          // 提取联系方式
          if (data.data) {
            console.log('\n✅ 联系方式:');
            console.log('  手机号:', data.data.phone || data.data.mobile || '未找到');
            console.log('  微信号:', data.data.wechat || data.data.weixin || '未找到');
          }
        }).catch(e => {
          console.log('解析响应失败:', e);
        });
        
        return response;
      });
    }
    
    return originalFetch.apply(this, args);
  };
  
  // 拦截 XMLHttpRequest
  const XHROpen = originalXHR.prototype.open;
  const XHRSend = originalXHR.prototype.send;
  
  originalXHR.prototype.open = function(method, url, ...rest) {
    this._url = url;
    this._method = method;
    return XHROpen.apply(this, [method, url, ...rest]);
  };
  
  originalXHR.prototype.send = function(...args) {
    if (this._url && (this._url.includes('contact_info') || this._url.includes('contact'))) {
      console.log('🔍 拦截到 XHR 请求:');
      console.log('  方法:', this._method);
      console.log('  URL:', this._url);
      console.log('  数据:', args[0]);
      
      this.addEventListener('load', function() {
        console.log('\n📦 响应数据:');
        console.log('  状态:', this.status);
        console.log('  响应:', this.responseText);
        
        try {
          const data = JSON.parse(this.responseText);
          console.log('\n✅ 解析后的数据:');
          console.log(JSON.stringify(data, null, 2));
          
          if (data.data) {
            console.log('\n✅ 联系方式:');
            console.log('  手机号:', data.data.phone || data.data.mobile || '未找到');
            console.log('  微信号:', data.data.wechat || data.data.weixin || '未找到');
          }
        } catch (e) {
          console.log('解析响应失败:', e);
        }
      });
    }
    
    return XHRSend.apply(this, args);
  };
  
  console.log('✅ 拦截器已安装');
  console.log('💡 现在点击页面上的眼睛图标，我会自动记录请求和响应');
  
})();
