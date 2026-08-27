import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ProductDataService } from './products/product-data.service';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  const dataService = inject(ProductDataService);
  return dataService.getToken() ? true : router.createUrlTree(['/login']);
};