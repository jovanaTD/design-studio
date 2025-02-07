import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';

@Component({
  selector: 'cds-splash-screen',
  templateUrl: './cds-splash-screen.component.html',
  styleUrls: ['./cds-splash-screen.component.scss']
})
export class CdsSplashScreenComponent implements OnInit {
  
  @Input() text: string
  @Input() videoUrl: string;
  @Input() videoDescription: string;
  @Input() section:  "cds-sb-intents" | "cds-sb-fulfillment" | "cds-sb-training" | "cds-sb-rules" | "cds-sb-settings"
  @Output() onClickBtn = new EventEmitter();

  canShowVideo: boolean = true
  url: SafeResourceUrl = null
  constructor(
      public appStorageService: AppStorageService,
      private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(){
    let canShowVideo = this.appStorageService.getItem('HAS_WATCHED_'+ this.section+ '_VIDEO')
    if(!canShowVideo || canShowVideo === 'false'){
      this.url = this.sanitizer.bypassSecurityTrustResourceUrl(this.videoUrl+'?rel=0&autoplay=0&controls=1&showinfo=0')
      this.canShowVideo = true
      this.appStorageService.setItem('HAS_WATCHED_'+ this.section+ '_VIDEO', true)
    }else{
      this.canShowVideo = false
    }
  }

  onAdd() {
    this.onClickBtn.emit(true);
  }

}
