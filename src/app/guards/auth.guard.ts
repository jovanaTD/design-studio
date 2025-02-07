import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserModel } from 'src/chat21-core/models/user';
import { AppStorageService } from 'src/chat21-core/providers/abstract/app-storage.service';
import { TiledeskAuthService } from 'src/chat21-core/providers/tiledesk/tiledesk-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  user: UserModel;

  constructor(
    private appStorageService: AppStorageService,
    private tiledeskAuthService: TiledeskAuthService,
  ){ }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    
    const url = state.url;
    const _url = route['_routerState'].url

    const queryParams = route.queryParams['jwt']
    console.log('[AUTH-GUARD] -->', queryParams)
    // if(!queryParams){
    //   return false
    // }
    const storedTiledeskoken = this.appStorageService.getItem('tiledeskToken')
    if(!queryParams && !storedTiledeskoken){
      //goToSignIn Dashboard
      return false
    }    

    var isAuthenticated = await this.tiledeskAuthService.isLoggedIn(); 
    console.log('isAuthenticated-->', isAuthenticated)
    if (!isAuthenticated) { 
      //goToSignIn Dashboard
      return false
    } 
    return isAuthenticated; 

  }
  
}
