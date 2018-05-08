import { SharedModule } from '../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AddNodeComponent } from './add-node.component';
import { AwsAddNodeComponent } from './aws-add-node/aws-add-node.component';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node/digitalocean-add-node.component';
import { DigitaloceanOptionsComponent } from './digitalocean-add-node/digitalocean-options/digitalocean-options.component';
import { OpenstackAddNodeComponent } from './openstack-add-node/openstack-add-node.component';
import { fakeAWSCluster, fakeDigitaloceanCluster, fakeOpenstackCluster } from '../testing/fake-data/cluster.fake';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { ApiService } from '../core/services';
import { asyncData } from '../testing/services/api-mock.service';
import { fakeDigitaloceanSizes, fakeOpenstackFlavors } from '../testing/fake-data/addNodeModal.fake';
import { HetznerAddNodeComponent } from './hetzner-add-node/hetzner-add-node.component';
import Spy = jasmine.Spy;
import { VSphereAddNodeComponent } from './vsphere-add-node/vsphere-add-node.component';

describe('AddNodeComponent', () => {
  let fixture: ComponentFixture<AddNodeComponent>;
  let component: AddNodeComponent;
  let getDigitaloceanSizesSpy: Spy;
  let getOpenStackFlavorsSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizes', 'getOpenStackFlavors']);
    getDigitaloceanSizesSpy = apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes));
    getOpenStackFlavorsSpy = apiMock.getOpenStackFlavors.and.returnValue(asyncData(fakeOpenstackFlavors));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
      ],
      declarations: [
        AddNodeComponent,
        OpenstackAddNodeComponent,
        AwsAddNodeComponent,
        DigitaloceanAddNodeComponent,
        DigitaloceanOptionsComponent,
        HetznerAddNodeComponent,
        VSphereAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        { provide: ApiService, useValue: apiMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster;
  });

  it('should create the add node cmp', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render specific form by provider in cluster.spec.cloud', () => {
    fixture.detectChanges();
    const addNodeElement: HTMLElement = fixture.nativeElement;

    expect(addNodeElement.querySelector('kubermatic-aws-add-node')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-openstack-add-node')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-add-node')).toBeNull();

    component.cluster = fakeDigitaloceanCluster;
    fixture.detectChanges();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-add-node')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-aws-add-node')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-openstack-add-node')).toBeNull();

    component.cluster = fakeOpenstackCluster;
    fixture.detectChanges();
    expect(addNodeElement.querySelector('kubermatic-openstack-add-node')).not.toBeNull();
    expect(addNodeElement.querySelector('kubermatic-digitalocean-add-node')).toBeNull();
    expect(addNodeElement.querySelector('kubermatic-aws-add-node')).toBeNull();
  });
});
