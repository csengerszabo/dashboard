import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {AddNodeService} from '../../core/services/add-node/add-node.service';
import {CloudSpec} from '../../shared/entity/ClusterEntity';
import {NodeInstanceFlavors} from '../../shared/model/NodeProviderConstants';
import {NodeData, NodeProviderData} from '../../shared/model/NodeSpecChange';

@Component({
  selector: 'kubermatic-hetzner-node-data',
  templateUrl: './hetzner-node-data.component.html',
})

export class HetznerNodeDataComponent implements OnInit, OnDestroy {
  @Input() cloudSpec: CloudSpec;
  @Input() nodeData: NodeData;

  types: string[] = NodeInstanceFlavors.Hetzner;
  hetznerNodeForm: FormGroup;
  private subscriptions: Subscription[] = [];

  constructor(private addNodeService: AddNodeService) {}

  ngOnInit(): void {
    this.hetznerNodeForm = new FormGroup({
      type: new FormControl(this.nodeData.spec.cloud.hetzner.type, Validators.required),
    });
    this.subscriptions.push(this.hetznerNodeForm.valueChanges.subscribe((data) => {
      this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
    }));

    this.addNodeService.changeNodeProviderData(this.getNodeProviderData());
  }

  ngOnDestroy(): void {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  getNodeProviderData(): NodeProviderData {
    return {
      spec: {
        hetzner: {
          type: this.hetznerNodeForm.controls.type.value,
        },
      },
      valid: this.hetznerNodeForm.valid,
    };
  }
}