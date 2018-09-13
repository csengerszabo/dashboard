import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort } from '@angular/material';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, DatacenterService, UserService } from '../../core/services';
import { AppConfigService } from '../../app-config.service';
import { ClusterEntity } from '../../shared/entity/ClusterEntity';
import { UserGroupConfig } from '../../shared/model/Config';
import { Subscription, ObservableInput, interval, combineLatest } from 'rxjs';
import { find } from 'lodash';

@Component({
  selector: 'kubermatic-cluster-list',
  templateUrl: './cluster-list.component.html',
  styleUrls: ['./cluster-list.component.scss']
})
export class ClusterListComponent implements OnInit, OnDestroy {

  public clusters: ClusterEntity[] = [];
  public loading = true;
  public sortedData: ClusterEntity[] = [];
  public sort: Sort = { active: 'name', direction: 'asc' };
  public projectID: string;
  public userGroup: string;
  public userGroupConfig: UserGroupConfig;
  private subscriptions: Subscription[] = [];

  constructor(private api: ApiService,
              private route: ActivatedRoute,
              private appConfigService: AppConfigService,
              private router: Router,
              private dcService: DatacenterService,
              private userService: UserService) {
  }

  ngOnInit() {
    this.userGroupConfig = this.appConfigService.getUserGroupConfig();
    this.subscriptions.push(
      this.route.paramMap.subscribe( m => {
        this.projectID = m.get('projectID');
        this.refreshClusters();
      })
    );


      this.userService.currentUserGroup(this.projectID).subscribe(group => {
        this.userGroup = group;
      });
    const timer = interval(5000);
    this.subscriptions.push(timer.subscribe(tick => {
      this.refreshClusters();
    }));
    this.refreshClusters();
  }

  ngOnDestroy() {
    for (const sub of this.subscriptions) {
      if (sub) {
        sub.unsubscribe();
      }
    }
  }

  refreshClusters() {
    this.subscriptions.push(this.dcService.getSeedDataCenters().subscribe(datacenters => {
      const clusters: ClusterEntity[] = [];
      const dcClustersObservables: Array<ObservableInput<ClusterEntity[]>> = [];
      for (const dc of datacenters) {
        dcClustersObservables.push(this.api.getClusters(dc.metadata.name, this.projectID));
      }
      this.subscriptions.push(combineLatest(dcClustersObservables)
        .subscribe(dcClusters => {
          for (const cs of dcClusters) {
            clusters.push(...cs);
          }
          this.clusters = clusters;
          this.sortData(this.sort);
          this.loading = false;
        }));
      this.userService.currentUserGroup(this.projectID).subscribe(group => {
        this.userGroup = group;
      });
    }));
  }

  public trackCluster(index: number, cluster: ClusterEntity): number {
    const prevCluster = find(this.clusters, item => {
      return item.name === cluster.name;
    });
    return prevCluster ? index : undefined;
  }

  public loadWizard() {
    this.router.navigate(['/wizard']);
  }

  sortData(sort: Sort) {
    if (sort === null || !sort.active || sort.direction === '') {
      this.sortedData = this.clusters;
      return;
    }

    this.sort = sort;

    this.sortedData = this.clusters.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name':
          return this.compare(a.name, b.name, isAsc);
        case 'provider':
          return this.getProvider(a, b, isAsc);
        case 'region':
          return this.compare(a.spec.cloud.dc, b.spec.cloud.dc, isAsc);
        default:
          return 0;
      }
    });
  }

  getProvider(a, b, isAsc) {
    let aProvider: string;
    let bProvider: string;

    if (a.spec.cloud.digitalocean) {
      aProvider = 'digitalocean';
    } else if (a.spec.cloud.bringyourown) {
      aProvider = 'bringyourown';
    } else if (a.spec.cloud.aws) {
      aProvider = 'aws';
    } else if (a.spec.cloud.openstack) {
      aProvider = 'openstack';
    } else {
      aProvider = '';
    }

    if (b.spec.cloud.digitalocean) {
      bProvider = 'digitalocean';
    } else if (b.spec.cloud.bringyourown) {
      bProvider = 'bringyourown';
    } else if (b.spec.cloud.aws) {
      bProvider = 'aws';
    } else if (b.spec.cloud.openstack) {
      bProvider = 'openstack';
    } else {
      bProvider = '';
    }

    return this.compare(aProvider, bProvider, isAsc);
  }

  compare(a, b, isAsc) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }
}
