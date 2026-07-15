export function isProduction(): boolean {
    return import.meta.env.MODE === 'production';
  }

function yapping(_a: any)
{
    // Debug logging removed for production
}
export  {yapping}