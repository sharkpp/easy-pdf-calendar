// XMLHttpRequest と同様の動作を fetch で実装したもの
// めも
//   React Advanced Cropper → 画像によっては XMLHttpRequest の load イベントが飛んで来ない場合があるようなので...
//   svg2pdf → Blob に拡張子を追加しないと画像種別を認識しなくなった... XMLHttpRequest の時には不要だったはず...

// https://developer.mozilla.org/ja/docs/Web/API/XMLHttpRequest/responseType
type XMLHttpRequestResponseType = "" | "arraybuffer" | "blob" | "document" | "json" | "text";

class FetchXMLHttpRequest {
  private _method: string = '';
  private _url: string = '';
  private _async: boolean = true;
  private _headers: Record<string, string> = {};
  private _responseText: string = '';
  private _responseBlob: Blob | null = null;
  private _responseArrayBuffer: ArrayBuffer | null = null;
  private _responseType: XMLHttpRequestResponseType = '';
  private _status: number = 0;
  private _statusText: string = '';
  private _readyState: number = 0;
  private _responseHeaders: Headers | null = null;

  private _onreadystatechange: ((event: Event) => void) | null = null;
  private _onload: ((event: ProgressEvent) => void) | null = null;
  private _onerror: ((event: ProgressEvent) => void) | null = null;

  // プロパティの getter/setter
  get readyState(): number {
    return this._readyState;
  }

  private set readyState(state: number) {
    this._readyState = state;
    if (this._onreadystatechange) {
      const event = new Event('readystatechange');
      this._onreadystatechange.call(this, event);
    }
  }

  get responseType(): XMLHttpRequestResponseType {
    return this._responseType;
  }

  set responseType(type: XMLHttpRequestResponseType) {
    if (['', 'text', 'blob', 'arraybuffer'].indexOf(type) < 0) {
      throw new Error(`Unsupported responseType: ${type}`);
    }
    this._responseType = type;
  }

  get status(): number {
    return this._status;
  }

  get statusText(): string {
    return this._statusText;
  }

  get response(): undefined | string | Blob | ArrayBuffer | null {
    switch (this._responseType || 'text') {
      case 'text':        return this._responseText;
      case 'blob':        return this._responseBlob;
      case 'arraybuffer': return this._responseArrayBuffer;
    }
    return null;
  }

  get responseText(): string {
    return this._responseText;
  }

  get responseURL(): string {
    console.log('responseURL',this._url)
    return this._url;
  }

  get onreadystatechange(): ((event: Event) => void) | null {
    return this._onreadystatechange;
  }

  set onreadystatechange(callback: (() => void) | null) {
    this._onreadystatechange = callback;
  }

  get onload(): ((event: ProgressEvent) => void) | null {
    return this._onload;
  }

  set onload(callback: ((event: ProgressEvent) => void) | null) {
    this._onload = callback;
  }

  get onerror(): ((event: ProgressEvent) => void) | null {
    return this._onerror;
  }

  set onerror(callback: ((event: ProgressEvent) => void) | null) {
    this._onerror = callback;
  }

  // メソッド
  open(method: string, url: string, async: boolean = true): void {
    this._method = method;
    this._url = url;
    this._async = async;
    this.readyState = 1;
  }

  setRequestHeader(header: string, value: string): void {
    this._headers[header] = value;
  }

  getAllResponseHeaders(): string {
    if (this._responseHeaders) {
      //console.log('getResponseHeader',this._responseHeaders.entries());
      return Array.from(this._responseHeaders.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .join('\r\n');
    }
    return '';
  }

  getResponseHeader(header: string): string | null {
    if (this._responseHeaders) {
      //console.log('getResponseHeader',this._responseHeaders.get(header));
      return this._responseHeaders.get(header) || null;
    }
    return null;
  }

  send(body: BodyInit | null = null): void {
    this.readyState = 2;

    fetch(this._url, {
      method: this._method,
      headers: this._headers,
      body: body,
    })
      .then<Blob | ArrayBuffer | string>((response: Response): Promise<Blob> | Promise<ArrayBuffer> | Promise<string> => {
        this._status = response.status;
        this._statusText = response.statusText;
        this._responseHeaders = response.headers;
        this.readyState = 3;

        switch (this._responseType || 'text') {
          //case 'text':        return response.text();
          case 'blob':        return response.blob();
          case 'arraybuffer': return response.arrayBuffer();
        }
        return response.text();
      })
      .then((data) => {
        //console.log(this._url,{data});
        switch (this._responseType || 'text') {
          case 'text':        this._responseText = data as string; break;
          case 'blob':        this._responseBlob = data as Blob; break;
          case 'arraybuffer': this._responseArrayBuffer = data as ArrayBuffer; break;
        }
        this.readyState = 4;

        if (this._onload) {
          const event = new ProgressEvent('load', { lengthComputable: false });
          this._onload.call(this, event);
        }
      })
      .catch((error) => {
        this.readyState = 4;

        if (this._onerror) {
          const event = new ProgressEvent('error', { lengthComputable: false });
          this._onerror.call(this, event);
        }

        console.error('Fetch error:', error);
      });
  }
}

// @ts-ignore
window.XMLHttpRequest = FetchXMLHttpRequest;
