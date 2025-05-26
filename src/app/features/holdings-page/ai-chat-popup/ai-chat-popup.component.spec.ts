import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatPopupComponent } from './ai-chat-popup.component';

describe('AiChatPopupComponent', () => {
  let component: AiChatPopupComponent;
  let fixture: ComponentFixture<AiChatPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiChatPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
