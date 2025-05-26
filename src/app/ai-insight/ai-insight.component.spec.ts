import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiInsightComponent } from './ai-insight.component';

describe('AiInsightComponent', () => {
  let component: AiInsightComponent;
  let fixture: ComponentFixture<AiInsightComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiInsightComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiInsightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
